const GOOGLE_ADS_BASE_URL = "https://googleads.googleapis.com/v19";

interface GoogleCampaignConfig {
  customerId: string;
  accessToken: string;
  developerToken: string;
  name: string;
  dailyBudget: number;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  targeting: {
    locations: string[];
    ageRanges: string[];
  };
}

async function googleAdsCall(
  endpoint: string,
  config: { customerId: string; accessToken: string; developerToken: string },
  data: unknown
) {
  const response = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${config.customerId}${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
        "developer-token": config.developerToken,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || `Google Ads API error: ${response.status}`
    );
  }

  return response.json();
}

export async function createGoogleCampaign(config: GoogleCampaignConfig) {
  const authConfig = {
    customerId: config.customerId,
    accessToken: config.accessToken,
    developerToken: config.developerToken,
  };

  // 1. Create Campaign Budget
  const budgetResult = await googleAdsCall(
    "/campaignBudgets:mutate",
    authConfig,
    {
      operations: [
        {
          create: {
            name: `${config.name} Budget`,
            amountMicros: (config.dailyBudget * 1_000_000).toString(),
            deliveryMethod: "STANDARD",
          },
        },
      ],
    }
  );
  const budgetResourceName = budgetResult.results[0].resourceName;

  // 2. Create Campaign
  const campaignResult = await googleAdsCall(
    "/campaigns:mutate",
    authConfig,
    {
      operations: [
        {
          create: {
            name: config.name,
            advertisingChannelType: "SEARCH",
            status: "PAUSED",
            campaignBudget: budgetResourceName,
            startDate: new Date().toISOString().split("T")[0].replace(/-/g, ""),
          },
        },
      ],
    }
  );
  const campaignResourceName = campaignResult.results[0].resourceName;

  // 3. Create Ad Group
  const adGroupResult = await googleAdsCall(
    "/adGroups:mutate",
    authConfig,
    {
      operations: [
        {
          create: {
            name: `${config.name} - Ad Group`,
            campaign: campaignResourceName,
            type: "SEARCH_STANDARD",
            status: "ENABLED",
            cpcBidMicros: "1000000", // $1 default CPC
          },
        },
      ],
    }
  );
  const adGroupResourceName = adGroupResult.results[0].resourceName;

  // 4. Create Responsive Search Ad
  const adResult = await googleAdsCall(
    "/adGroupAds:mutate",
    authConfig,
    {
      operations: [
        {
          create: {
            adGroup: adGroupResourceName,
            status: "PAUSED",
            ad: {
              responsiveSearchAd: {
                headlines: config.headlines.slice(0, 3).map((text, i) => ({
                  text,
                  pinnedField: i === 0 ? "HEADLINE_1" : undefined,
                })),
                descriptions: config.descriptions.slice(0, 2).map((text) => ({
                  text,
                })),
              },
              finalUrls: [config.finalUrl],
            },
          },
        },
      ],
    }
  );

  return {
    budgetResourceName,
    campaignResourceName,
    adGroupResourceName,
    adResourceName: adResult.results[0].resourceName,
  };
}

export async function getGoogleCampaignMetrics(
  customerId: string,
  campaignResourceName: string,
  accessToken: string,
  developerToken: string
) {
  const response = await fetch(
    `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
      },
      body: JSON.stringify({
        query: `SELECT campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.resource_name = '${campaignResourceName}'`,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Google Ads metrics");
  }

  const data = await response.json();
  const metrics = data[0]?.results?.[0]?.metrics || {};

  return {
    impressions: parseInt(metrics.impressions || "0"),
    clicks: parseInt(metrics.clicks || "0"),
    spend: parseInt(metrics.costMicros || "0") / 1_000_000,
    conversions: parseFloat(metrics.conversions || "0"),
  };
}
