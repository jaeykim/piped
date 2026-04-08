const META_API_VERSION = "v21.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaCampaignConfig {
  accessToken: string;
  adAccountId: string;
  name: string;
  objective: "OUTCOME_TRAFFIC" | "OUTCOME_AWARENESS" | "OUTCOME_SALES";
  dailyBudget: number;
  targeting: {
    ageMin: number;
    ageMax: number;
    genders: number[];
    geoLocations: { countries: string[] };
    interests?: { id: string; name: string }[];
  };
  adCreativeUrl: string;
  primaryText: string;
  headline: string;
  linkDescription: string;
  destinationUrl: string;
}

async function metaApiCall(
  endpoint: string,
  accessToken: string,
  data: Record<string, unknown>
) {
  const response = await fetch(`${META_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, access_token: accessToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || `Meta API error: ${response.status}`
    );
  }

  return response.json();
}

export async function createMetaCampaign(config: MetaCampaignConfig) {
  const { accessToken, adAccountId } = config;

  // 1. Create Campaign
  const campaign = await metaApiCall(
    `/act_${adAccountId}/campaigns`,
    accessToken,
    {
      name: config.name,
      objective: config.objective,
      status: "PAUSED",
      special_ad_categories: [],
    }
  );

  // 2. Create Ad Set
  const adSet = await metaApiCall(
    `/act_${adAccountId}/adsets`,
    accessToken,
    {
      name: `${config.name} - Ad Set`,
      campaign_id: campaign.id,
      daily_budget: config.dailyBudget * 100, // cents
      billing_event: "IMPRESSIONS",
      optimization_goal: "LINK_CLICKS",
      targeting: {
        age_min: config.targeting.ageMin,
        age_max: config.targeting.ageMax,
        genders: config.targeting.genders,
        geo_locations: config.targeting.geoLocations,
        flexible_spec: config.targeting.interests
          ? [{ interests: config.targeting.interests }]
          : undefined,
      },
      status: "PAUSED",
    }
  );

  // 3. Create Ad Creative
  const creative = await metaApiCall(
    `/act_${adAccountId}/adcreatives`,
    accessToken,
    {
      name: `${config.name} - Creative`,
      object_story_spec: {
        link_data: {
          image_url: config.adCreativeUrl,
          link: config.destinationUrl,
          message: config.primaryText,
          name: config.headline,
          description: config.linkDescription,
        },
      },
    }
  );

  // 4. Create Ad
  const ad = await metaApiCall(`/act_${adAccountId}/ads`, accessToken, {
    name: `${config.name} - Ad`,
    adset_id: adSet.id,
    creative: { creative_id: creative.id },
    status: "PAUSED",
  });

  return {
    campaignId: campaign.id,
    adSetId: adSet.id,
    creativeId: creative.id,
    adId: ad.id,
  };
}

// ─── Image Upload ───

export async function uploadAdImage(
  adAccountId: string,
  accessToken: string,
  imageBase64: string
): Promise<string> {
  // Meta requires multipart form upload for images
  const formData = new FormData();
  formData.append("access_token", accessToken);

  // Convert base64 to blob
  const binary = Buffer.from(imageBase64, "base64");
  const blob = new Blob([binary], { type: "image/png" });
  formData.append("filename", blob, "ad-creative.png");

  const response = await fetch(
    `${META_BASE_URL}/act_${adAccountId}/adimages`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Image upload failed");
  }

  const data = await response.json();
  // Response: { images: { "ad-creative.png": { hash: "...", url: "..." } } }
  const imageData = Object.values(data.images || {})[0] as { hash: string; url: string };
  return imageData?.hash || "";
}

// ─── Full Campaign with Image Upload ───

export async function createMetaCampaignWithImage(
  config: MetaCampaignConfig & { imageBase64?: string }
) {
  const { accessToken, adAccountId } = config;

  let imageUrl = config.adCreativeUrl;

  // Upload image if base64 provided
  if (config.imageBase64) {
    const imageHash = await uploadAdImage(adAccountId, accessToken, config.imageBase64);
    // Use image_hash instead of image_url in creative
    const campaign = await metaApiCall(`/act_${adAccountId}/campaigns`, accessToken, {
      name: config.name, objective: config.objective, status: "PAUSED", special_ad_categories: [],
    });

    const adSet = await metaApiCall(`/act_${adAccountId}/adsets`, accessToken, {
      name: `${config.name} - Ad Set`, campaign_id: campaign.id,
      daily_budget: config.dailyBudget * 100, billing_event: "IMPRESSIONS",
      optimization_goal: "LINK_CLICKS", status: "PAUSED",
      targeting: {
        age_min: config.targeting.ageMin, age_max: config.targeting.ageMax,
        genders: config.targeting.genders, geo_locations: config.targeting.geoLocations,
        flexible_spec: config.targeting.interests ? [{ interests: config.targeting.interests }] : undefined,
      },
    });

    const creative = await metaApiCall(`/act_${adAccountId}/adcreatives`, accessToken, {
      name: `${config.name} - Creative`,
      object_story_spec: {
        link_data: {
          image_hash: imageHash,
          link: config.destinationUrl,
          message: config.primaryText,
          name: config.headline,
          description: config.linkDescription,
        },
      },
    });

    const ad = await metaApiCall(`/act_${adAccountId}/ads`, accessToken, {
      name: `${config.name} - Ad`, adset_id: adSet.id,
      creative: { creative_id: creative.id }, status: "PAUSED",
    });

    return { campaignId: campaign.id, adSetId: adSet.id, creativeId: creative.id, adId: ad.id };
  }

  // Fallback: use URL-based creative (existing flow)
  return createMetaCampaign(config);
}

// ─── Metrics ───

export async function getMetaCampaignMetrics(
  campaignId: string,
  accessToken: string
) {
  const fields = "impressions,clicks,spend,ctr,cpc,actions,cost_per_action_type";
  const response = await fetch(
    `${META_BASE_URL}/${campaignId}/insights?fields=${fields}&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch campaign metrics");
  }

  const data = await response.json();
  const insights = data.data?.[0] || {};
  const actions = insights.actions || [];
  const costPerAction = insights.cost_per_action_type || [];

  const conversions = actions.find(
    (a: { action_type: string }) => a.action_type === "offsite_conversion"
  )?.value || 0;
  const cpa = costPerAction.find(
    (a: { action_type: string }) => a.action_type === "offsite_conversion"
  )?.value || 0;

  return {
    impressions: parseInt(insights.impressions || "0"),
    clicks: parseInt(insights.clicks || "0"),
    spend: parseFloat(insights.spend || "0"),
    ctr: parseFloat(insights.ctr || "0"),
    cpc: parseFloat(insights.cpc || "0"),
    conversions: parseInt(conversions),
    cpa: parseFloat(cpa),
    roas: parseFloat(insights.spend) > 0 && conversions > 0
      ? (conversions * 50) / parseFloat(insights.spend) // estimated ROAS
      : 0,
  };
}

// ─── Daily Time-Series Metrics ───

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  conversionValue: number;
  roas: number;
}

export async function getMetaCampaignDailyMetrics(
  objectId: string,
  accessToken: string,
  days: number = 14
): Promise<DailyMetric[]> {
  const fields =
    "date_start,impressions,clicks,spend,ctr,cpc,actions,action_values";
  const url = `${META_BASE_URL}/${objectId}/insights?fields=${fields}&time_increment=1&date_preset=last_${days}_d&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  const rows = (data.data || []) as Array<{
    date_start: string;
    impressions?: string;
    clicks?: string;
    spend?: string;
    ctr?: string;
    cpc?: string;
    actions?: { action_type: string; value: string }[];
    action_values?: { action_type: string; value: string }[];
  }>;

  return rows.map((r) => {
    const spend = parseFloat(r.spend || "0");
    const purchaseValue = parseFloat(
      r.action_values?.find((a) =>
        ["purchase", "offsite_conversion.fb_pixel_purchase"].includes(
          a.action_type
        )
      )?.value || "0"
    );
    const conversions = parseInt(
      r.actions?.find((a) =>
        ["purchase", "offsite_conversion.fb_pixel_purchase"].includes(
          a.action_type
        )
      )?.value || "0"
    );
    return {
      date: r.date_start,
      spend,
      impressions: parseInt(r.impressions || "0"),
      clicks: parseInt(r.clicks || "0"),
      ctr: parseFloat(r.ctr || "0"),
      cpc: parseFloat(r.cpc || "0"),
      conversions,
      conversionValue: purchaseValue,
      roas: spend > 0 ? purchaseValue / spend : 0,
    };
  });
}

// ─── Ad Control ───

export async function updateAdStatus(
  adId: string,
  accessToken: string,
  status: "ACTIVE" | "PAUSED" | "ARCHIVED"
) {
  const response = await fetch(`${META_BASE_URL}/${adId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, access_token: accessToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update ad status");
  }
  return response.json();
}

// ─── List Campaigns ───

export async function listCampaigns(
  adAccountId: string,
  accessToken: string
) {
  const fields = "name,status,objective,daily_budget,created_time";
  const response = await fetch(
    `${META_BASE_URL}/act_${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`
  );

  if (!response.ok) throw new Error("Failed to list campaigns");
  const data = await response.json();
  return data.data || [];
}
