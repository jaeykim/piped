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

export async function getMetaCampaignMetrics(
  campaignId: string,
  accessToken: string
) {
  const response = await fetch(
    `${META_BASE_URL}/${campaignId}/insights?fields=impressions,clicks,spend,actions&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch campaign metrics");
  }

  const data = await response.json();
  const insights = data.data?.[0] || {};

  return {
    impressions: parseInt(insights.impressions || "0"),
    clicks: parseInt(insights.clicks || "0"),
    spend: parseFloat(insights.spend || "0"),
    conversions:
      insights.actions?.find(
        (a: { action_type: string }) => a.action_type === "offsite_conversion"
      )?.value || 0,
  };
}
