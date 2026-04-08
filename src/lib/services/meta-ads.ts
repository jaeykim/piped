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
    /** Meta gender codes: 1 = male, 2 = female. Empty/undefined = all. */
    genders: number[];
    geoLocations: { countries: string[] };
    interests?: { id: string; name: string }[];
    /** Targeting locales — Meta locale IDs. Empty = all. */
    locales?: number[];
  };
  /** Meta placement keys, e.g. instagram_feed, instagram_stories, facebook_feed. */
  placements?: string[];
  /** Optional ad set bid strategy. Defaults to LOWEST_COST_WITHOUT_CAP. */
  bidStrategy?:
    | "LOWEST_COST_WITHOUT_CAP"
    | "LOWEST_COST_WITH_BID_CAP"
    | "COST_CAP";
  /** Schedule. Pass undefined for "run continuously". */
  scheduleStart?: string; // ISO timestamp
  scheduleEnd?: string;
  adCreativeUrl: string;
  primaryText: string;
  headline: string;
  linkDescription: string;
  destinationUrl: string;
}

// Map our human-friendly placement keys to Meta's publisher_platforms /
// {facebook,instagram}_positions / device_platforms structure.
function buildPlacementSpec(placements: string[] | undefined) {
  if (!placements || placements.length === 0) return undefined;
  const fbPositions: string[] = [];
  const igPositions: string[] = [];
  const publisherPlatforms = new Set<string>();
  for (const p of placements) {
    if (p === "facebook_feed") {
      publisherPlatforms.add("facebook");
      fbPositions.push("feed");
    } else if (p === "facebook_stories") {
      publisherPlatforms.add("facebook");
      fbPositions.push("story");
    } else if (p === "facebook_reels") {
      publisherPlatforms.add("facebook");
      fbPositions.push("facebook_reels");
    } else if (p === "instagram_feed") {
      publisherPlatforms.add("instagram");
      igPositions.push("stream");
    } else if (p === "instagram_stories") {
      publisherPlatforms.add("instagram");
      igPositions.push("story");
    } else if (p === "instagram_reels") {
      publisherPlatforms.add("instagram");
      igPositions.push("reels");
    } else if (p === "instagram_explore") {
      publisherPlatforms.add("instagram");
      igPositions.push("explore");
    }
  }
  const spec: Record<string, unknown> = {
    publisher_platforms: Array.from(publisherPlatforms),
  };
  if (fbPositions.length) spec.facebook_positions = fbPositions;
  if (igPositions.length) spec.instagram_positions = igPositions;
  return spec;
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
    const errBody = await response.json().catch(() => ({}));
    const e = errBody.error || {};
    // Meta's "Invalid parameter" alone is useless — pull every diagnostic
    // field they return so we can actually debug from the journal.
    const detail = [
      e.message,
      e.error_user_title && `(${e.error_user_title})`,
      e.error_user_msg,
      e.error_subcode && `subcode=${e.error_subcode}`,
      e.fbtrace_id && `fbtrace=${e.fbtrace_id}`,
    ]
      .filter(Boolean)
      .join(" — ");
    console.error(`Meta API ${endpoint} failed:`, JSON.stringify(errBody));
    throw new Error(detail || `Meta API error: ${response.status}`);
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
  const placementSpec = buildPlacementSpec(config.placements);
  const targetingObj: Record<string, unknown> = {
    age_min: config.targeting.ageMin,
    age_max: config.targeting.ageMax,
    geo_locations: config.targeting.geoLocations,
  };
  // Only include genders if specified (empty = all genders, which is the
  // Meta default and avoiding the field is safer than passing []).
  if (config.targeting.genders.length > 0) {
    targetingObj.genders = config.targeting.genders;
  }
  if (config.targeting.interests?.length) {
    targetingObj.flexible_spec = [{ interests: config.targeting.interests }];
  }
  if (config.targeting.locales?.length) {
    targetingObj.locales = config.targeting.locales;
  }
  if (placementSpec) {
    Object.assign(targetingObj, placementSpec);
  }

  const adSetPayload: Record<string, unknown> = {
    name: `${config.name} - Ad Set`,
    campaign_id: campaign.id,
    daily_budget: Math.round(config.dailyBudget * 100), // cents
    billing_event: "IMPRESSIONS",
    optimization_goal: "LINK_CLICKS",
    bid_strategy: config.bidStrategy ?? "LOWEST_COST_WITHOUT_CAP",
    targeting: targetingObj,
    status: "PAUSED",
  };
  if (config.scheduleStart) adSetPayload.start_time = config.scheduleStart;
  if (config.scheduleEnd) adSetPayload.end_time = config.scheduleEnd;

  const adSet = await metaApiCall(
    `/act_${adAccountId}/adsets`,
    accessToken,
    adSetPayload
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

// ─── Budget Update ───

/**
 * Update the daily budget on a Meta ad set. Meta stores budgets in the
 * account currency's minor units (cents for USD).
 */
export async function updateAdSetDailyBudget(
  adSetId: string,
  accessToken: string,
  dailyBudgetUsd: number
) {
  const response = await fetch(`${META_BASE_URL}/${adSetId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      daily_budget: Math.round(dailyBudgetUsd * 100),
      access_token: accessToken,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update daily budget");
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
