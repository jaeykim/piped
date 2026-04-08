export type AppLocale = "en" | "ko" | "ja" | "zh";

export interface AppText {
  // Auth
  auth: {
    welcomeBack: string;
    signInDesc: string;
    createAccount: string;
    signUpDesc: string;
    email: string;
    password: string;
    displayName: string;
    signIn: string;
    signUp: string;
    continueWithGoogle: string;
    noAccount: string;
    hasAccount: string;
    invalidCredentials: string;
    signUpFailed: string;
    googleFailed: string;
    passwordMin: string;
  };
  // Onboarding
  onboarding: {
    title: string;
    subtitle: string;
    owner: string;
    ownerDesc: string;
    influencer: string;
    influencerDesc: string;
    continue: string;
    selectRole: string;
  };
  // Sidebar
  sidebar: {
    dashboard: string;
    campaigns: string;
    creatives: string;
    reports: string;
    projects: string;
    browsePrograms: string;
    partnerHub: string;
    myPrograms: string;
    earnings: string;
    settings: string;
    signOut: string;
    productOwner: string;
    influencer: string;
  };
  // Dashboard
  dashboard: {
    title: string;
    welcomeBack: string;
    newProject: string;
    recentProjects: string;
    noProjects: string;
    noProjectsDesc: string;
    createProject: string;
    projectCount: string;
    campaignCount: string;
    affiliateCount: string;
    // Influencer
    welcomeInfluencer: string;
    influencerDesc: string;
    browsePrograms: string;
    findProducts: string;
    myEarnings: string;
    trackCommissions: string;
    deleteConfirm: string;
    deleted: string;
    deleteFailed: string;
  };
  // Projects
  projects: {
    title: string;
    newProject: string;
    enterUrl: string;
    enterUrlDesc: string;
    urlPlaceholder: string;
    startPipeline: string;
    creating: string;
    crawling: string;
    analyzed: string;
    analysisFailed: string;
    fetchingContent: string;
    extractingMeta: string;
    analyzingBrand: string;
    chooseCampaignType: string;
    campaignType: string;
    websiteUrl: string;
    changeCampaignType: string;
    notEnoughCredits: string;
    notEnoughCreditsDesc: string;
    buyCredits: string;
    // Stage labels
    stageAnalyzing: string;
    stageCopy: string;
    stageCreatives: string;
    stageCampaigns: string;
    stageAffiliates: string;
  };
  // Project detail
  projectDetail: {
    pipelineProgress: string;
    analysisResult: string;
    product: string;
    audience: string;
    features: string;
    toneAndIndustry: string;
    brandColors: string;
    generateCopy: string;
    generateCopyDesc: string;
    createCreatives: string;
    createCreativesDesc: string;
    videoProduction: string;
    videoProductionDesc: string;
    launchCampaigns: string;
    launchCampaignsDesc: string;
    affiliateProgram: string;
    affiliateProgramDesc: string;
    completed: string;
    currentStep: string;
    clickToEdit: string;
  };
  // Copy
  copy: {
    title: string;
    subtitle: string;
    selectCountry: string;
    selectLanguage: string;
    generateButton: string;
    generating: string;
    generatingDesc: string;
    generated: string;
    regenerateAll: string;
    nextCreatives: string;
    nextCreativesDesc: string;
    continue: string;
    headlines: string;
    shortDesc: string;
    longDesc: string;
    metaAds: string;
    googleAds: string;
    socialPosts: string;
    ctas: string;
    edited: string;
    copyUpdated: string;
    save: string;
    cancel: string;
    edit: string;
    generatingHeadlines: string;
    generatingDescs: string;
    generatingAdCopy: string;
    generatingSocial: string;
  };
  // Creatives
  creatives: {
    title: string;
    whatToCreate: string;
    imageAd: string;
    imageAdDesc: string;
    imageAdDetail: string;
    videoAd: string;
    videoAdDesc: string;
    videoAdDetail: string;
    selectConcept: string;
    selectSubject: string;
    selectCopy: string;
    selectCopyDesc: string;
    customInput: string;
    customPlaceholder: string;
    charLimit: string;
    previousCopy: string;
    noCopy: string;
    noCopyDesc: string;
    autoFallback: string;
    generateButton: string;
    generating: string;
    elapsed: string;
    waitMore: string;
    skip: string;
    failed: string;
    failedDesc: string;
    retry: string;
    reselect: string;
    regenerate: string;
    allGenerated: string;
    partialGenerated: string;
    allFailed: string;
    nextCampaigns: string;
    nextCampaignsDesc: string;
    changeImage: string;
    selectImage: string;
    videoGenerating: string;
    videoCredits: string;
  };
  // Settings
  settings: {
    title: string;
    profile: string;
    role: string;
    saveChanges: string;
    profileUpdated: string;
    updateFailed: string;
    integrations: string;
    metaAds: string;
    metaAdsDesc: string;
    googleAds: string;
    googleAdsDesc: string;
    connected: string;
    connect: string;
    disconnect: string;
    disconnected: string;
    connectFailed: string;
    googleConnected: string;
    googleFailed: string;
    metaConnected: string;
    metaFailed: string;
    security: string;
    resetPassword: string;
    resetSent: string;
    // Credits
    creditsTitle: string;
    creditsUnit: string;
    perCredit: string;
    receiptEmail: string;
    agreeTermsLabel: string;
    termsLink: string;
    privacyLink: string;
    agreeRefundLabel: string;
    payCard: string;
    payCrypto: string;
    cryptoOff: string;
    cryptoNetworks: string;
    creditUsage: string;
    siteAnalysis: string;
    copyGeneration: string;
    imageGraphic: string;
    imageAi: string;
    videoGeneration: string;
    campaignCreation: string;
    creditCharged: string;
    chargeFailed: string;
    paymentCancelled: string;
    // Payout
    payoutTitle: string;
    payoutDesc: string;
    network: string;
    walletAddress: string;
    walletPlaceholder: string;
    walletSaved: string;
    saveFailed: string;
    // Integrations info
    integrationsInfo: string;
    loading: string;
    connectionFailed: string;
  };
  // Campaigns
  campaigns: {
    title: string;
    dashboard: string;
    newCampaign: string;
    noCampaigns: string;
    noCampaignsDesc: string;
    createFirst: string;
    platform: string;
    choosePlatform: string;
    content: string;
    selectAdCopy: string;
    noCopy: string;
    selectCreative: string;
    noCreative: string;
    selected: string;
    targeting: string;
    minAge: string;
    maxAge: string;
    locations: string;
    interests: string;
    budget: string;
    campaignName: string;
    dailyBudget: string;
    monthlyEstimate: string;
    review: string;
    reviewCampaign: string;
    statusPaused: string;
    createCampaign: string;
    created: string;
    creationFailed: string;
    back: string;
    next: string;
    // Campaign list stats
    refreshMetrics: string;
    campaignList: string;
    totalImpressions: string;
    totalClicks: string;
    totalSpend: string;
    impressions: string;
    clicks: string;
    spend: string;
    ctr: string;
    cpc: string;
    roas: string;
    conversions: string;
    pause: string;
    resume: string;
    metricsUpdated: string;
    metricsUpdateFailed: string;
    adStarted: string;
    adPaused: string;
    adStatusFailed: string;
    // Influencer campaign
    goalAndCommission: string;
    goalLabel: string;
    visits: string;
    visitsDesc: string;
    signups: string;
    signupsDesc: string;
    purchases: string;
    purchasesDesc: string;
    recommended: string;
    commissionType: string;
    fixedAmount: string;
    percentage: string;
    commissionLabel: string;
    cookieDuration: string;
    estimatedCost: string;
    influencerBudget: string;
    totalBudget: string;
    budgetExhausted: string;
    trackingMetrics: string;
    referralClicks: string;
    uniqueVisitors: string;
    signupConversions: string;
    purchaseConversions: string;
    conversionRate: string;
    performanceByInfluencer: string;
    commissionStatus: string;
    roi: string;
    campaignReview: string;
    type: string;
    goal: string;
    commissionPerAction: string;
    cookiePeriod: string;
    status: string;
    autoCreateAffiliate: string;
    createdAsPaused: string;
    targetInfo: string;
    influencerCreated: string;
    // Tracking setup
    signupTrackingGuide: string;
    purchaseTrackingGuide: string;
    autoTracked: string;
    externalSignupTracking: string;
    externalPurchaseTracking: string;
    cookieAutoRead: string;
    claudeCodeGuide: string;
    claudeCodeTrackingDesc: string;
    // Next section
    nextAffiliates: string;
    nextAffiliatesDesc: string;
  };
  // Affiliates
  affiliates: {
    browseTitle: string;
    browseDesc: string;
    myPrograms: string;
    earnings: string;
    totalEarnings: string;
    commission: string;
    cookieDays: string;
    affiliateCount: string;
    joinProgram: string;
    switchToJoin: string;
    joined: string;
    yourLink: string;
    clicks: string;
    conversions: string;
    noPrograms: string;
  };
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    notAuthenticated: string;
    waiting: string;
    next: string;
    back: string;
    save: string;
    cancel: string;
    continue: string;
    delete: string;
    confirm: string;
    credits: string;
    creditsPerUnit: string;
    popular: string;
    processing: string;
  };
}

const en: AppText = {
  auth: {
    welcomeBack: "Welcome back",
    signInDesc: "Sign in to your Piped account",
    createAccount: "Create your account",
    signUpDesc: "Create AI-powered ad images in minutes",
    email: "Email",
    password: "Password",
    displayName: "Display Name",
    signIn: "Sign In",
    signUp: "Create Account",
    continueWithGoogle: "Continue with Google",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    invalidCredentials: "Invalid email or password",
    signUpFailed: "Failed to create account. Email may already be in use.",
    googleFailed: "Google sign in failed",
    passwordMin: "Password must be at least 6 characters",
  },
  onboarding: {
    title: "Choose Your Role",
    subtitle: "How will you use Piped?",
    owner: "Maker",
    ownerDesc: "I want to create AI-powered ad images for my product or service.",
    influencer: "Influencer",
    influencerDesc: "I want to discover great products, promote them to my audience, and earn commissions.",
    continue: "Continue",
    selectRole: "Please select a role",
  },
  sidebar: {
    dashboard: "Dashboard",
    campaigns: "Campaigns",
    creatives: "Creatives",
    reports: "Reports",
    projects: "Projects",
    browsePrograms: "Browse Programs",
    partnerHub: "Partner Hub",
    myPrograms: "My Programs",
    earnings: "Earnings",
    settings: "Settings",
    signOut: "Sign Out",
    productOwner: "Maker",
    influencer: "Influencer",
  },
  dashboard: {
    title: "Dashboard",
    welcomeBack: "Welcome back",
    newProject: "New Project",
    recentProjects: "Recent Projects",
    noProjects: "No projects yet",
    noProjectsDesc: "Create your first project to generate AI ad images.",
    createProject: "Create Campaign",
    projectCount: "Projects",
    campaignCount: "Images",
    affiliateCount: "Affiliates",
    welcomeInfluencer: "Welcome",
    influencerDesc: "Discover products to promote and earn commissions.",
    browsePrograms: "Browse Programs",
    findProducts: "Find products to promote",
    myEarnings: "My Earnings",
    trackCommissions: "Track your commissions",
    deleteConfirm: 'Delete campaign "{name}"? This cannot be undone.',
    deleted: "Project deleted",
    deleteFailed: "Failed to delete",
  },
  projects: {
    title: "New Project",
    newProject: "New Project",
    enterUrl: "Enter your product URL",
    enterUrlDesc: "AI will analyze your page and create ad images",
    urlPlaceholder: "https://your-product.com",
    startPipeline: "Generate Ad Images",
    creating: "Creating project...",
    crawling: "Crawling website...",
    analyzed: "Website analyzed successfully!",
    analysisFailed: "Analysis failed",
    fetchingContent: "Fetching page content",
    extractingMeta: "Extracting text and metadata",
    analyzingBrand: "AI analyzing your brand",
    chooseCampaignType: "Choose Campaign Type",
    campaignType: "Campaign Type",
    websiteUrl: "Website URL",
    changeCampaignType: "Change campaign type",
    notEnoughCredits: "Not enough credits",
    notEnoughCreditsDesc: "You need at least {min} credits. Current balance: {current}",
    buyCredits: "Buy Credits",
    stageAnalyzing: "Analyzing",
    stageCopy: "Copy Ready",
    stageCreatives: "Creatives",
    stageCampaigns: "Campaigns",
    stageAffiliates: "Affiliates",
  },
  projectDetail: {
    pipelineProgress: "Pipeline Progress",
    analysisResult: "Analysis Result",
    product: "Product",
    audience: "Target Audience",
    features: "Key Features",
    toneAndIndustry: "Tone & Industry",
    brandColors: "Brand Colors",
    generateCopy: "Generate Marketing Copy",
    generateCopyDesc: "AI-powered headlines, descriptions, and ad copy",
    createCreatives: "Create Ad Creatives",
    createCreativesDesc: "Stunning visuals for every platform",
    videoProduction: "Video Production",
    videoProductionDesc: "Convert ad images to AI video",
    launchCampaigns: "Launch Campaigns",
    launchCampaignsDesc: "Deploy to Meta & Google Ads",
    affiliateProgram: "Affiliate Program",
    affiliateProgramDesc: "Let influencers promote your product",
    completed: "Done",
    currentStep: "Current",
    clickToEdit: "Click to edit or regenerate",
  },
  copy: {
    title: "Marketing Copy",
    subtitle: "Select target country and language to generate marketing copy",
    selectCountry: "Target Country",
    selectLanguage: "Ad Language",
    generateButton: "Generate Marketing Copy",
    generating: "Generating marketing copy...",
    generatingDesc: "Creating Headlines, Descriptions, Ad Copy, and Social Posts",
    generated: "Marketing copy generated!",
    regenerateAll: "Regenerate All",
    nextCreatives: "Next: Generate Ad Creatives",
    nextCreativesDesc: "Create stunning visuals powered by AI",
    continue: "Continue",
    headlines: "Headlines",
    shortDesc: "Short Descriptions",
    longDesc: "Long Descriptions",
    metaAds: "Meta Ads",
    googleAds: "Google Ads",
    socialPosts: "Social Posts",
    ctas: "CTAs",
    edited: "Edited",
    copyUpdated: "Copy updated",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    generatingHeadlines: "Generating Headlines",
    generatingDescs: "Generating Descriptions",
    generatingAdCopy: "Generating Ad Copy",
    generatingSocial: "Generating Social Posts",
  },
  creatives: {
    title: "Ad Creatives",
    whatToCreate: "What would you like to create?",
    imageAd: "Image Ad",
    imageAdDesc: "Create static image ads for Instagram, Facebook, Google.",
    imageAdDetail: "AI image generation + text overlay + 5 format auto-conversion",
    videoAd: "Video Ad",
    videoAdDesc: "Create 5-second motion videos from images.",
    videoAdDetail: "Cinematic motion generation with Google Veo AI",
    selectConcept: "Choose a concept to hook your audience",
    selectSubject: "Ad Subject",
    selectCopy: "Select Marketing Copy",
    selectCopyDesc: "Choose a hook text for the image",
    customInput: "Custom text",
    customPlaceholder: "Enter marketing text for the image",
    charLimit: "Shorter and punchier = better hooking",
    previousCopy: "Previously generated copy",
    noCopy: "No copy generated yet",
    noCopyDesc: "Type custom text or generate copy first",
    autoFallback: "If no text selected, the product value proposition will be used",
    generateButton: "Generate Images",
    generating: "Generating",
    elapsed: "s elapsed",
    waitMore: " — almost there",
    skip: "Skip",
    failed: "Generation failed",
    failedDesc: "Timeout or error occurred",
    retry: "Retry",
    reselect: "Reselect",
    regenerate: "Regenerate",
    allGenerated: "All images generated!",
    partialGenerated: "Some images generated. You can retry failed ones.",
    allFailed: "Image generation failed. Please try again.",
    nextCampaigns: "Next: Launch Campaigns",
    nextCampaignsDesc: "Set up ad campaigns on Meta or Google Ads",
    changeImage: "Change Image",
    selectImage: "Select Image",
    videoGenerating: "Generating video...",
    videoCredits: "Create Video (30 credits)",
  },
  settings: {
    title: "Settings",
    profile: "Profile",
    role: "Role",
    saveChanges: "Save Changes",
    profileUpdated: "Profile updated",
    updateFailed: "Failed to update profile",
    integrations: "Ad Platform Integrations",
    metaAds: "Meta Ads",
    metaAdsDesc: "Facebook & Instagram advertising",
    googleAds: "Google Ads",
    googleAdsDesc: "Search & display advertising",
    connected: "Connected",
    connect: "Connect",
    disconnect: "Disconnect",
    disconnected: "Google Ads disconnected",
    connectFailed: "Connection failed",
    googleConnected: "Google Ads connected!",
    googleFailed: "Google Ads connection failed",
    metaConnected: "Meta Ads connected!",
    metaFailed: "Meta Ads connection failed",
    security: "Security",
    resetPassword: "Reset Password",
    resetSent: "Password reset email sent!",
    creditsTitle: "Credits",
    creditsUnit: "credits",
    perCredit: "per credit",
    receiptEmail: "Receipt email",
    agreeTermsLabel: "I agree to the",
    termsLink: "Terms of Service",
    privacyLink: "Privacy Policy",
    agreeRefundLabel: "Credits are digital goods charged immediately upon purchase and are non-refundable.",
    payCard: "Pay with Card",
    payCrypto: "Pay with Crypto",
    cryptoOff: "5% OFF",
    cryptoNetworks: "Crypto: Ethereum · Arbitrum · Base · BSC (USDT/USDC)",
    creditUsage: "Credit Usage",
    siteAnalysis: "Site analysis: 5",
    copyGeneration: "Copy generation: 10",
    imageGraphic: "Image (graphic): 5",
    imageAi: "Image (AI): 15",
    videoGeneration: "Video generation: 30",
    campaignCreation: "Campaign creation: 5",
    creditCharged: "credits charged!",
    chargeFailed: "Charge failed",
    paymentCancelled: "Payment cancelled",
    payoutTitle: "Payout Address",
    payoutDesc: "Enter your crypto wallet address for affiliate earnings",
    network: "Network",
    walletAddress: "Wallet address",
    walletPlaceholder: "0x... or wallet address",
    walletSaved: "Wallet address saved",
    saveFailed: "Save failed",
    integrationsInfo: "Piped automates AI-powered ad copy, creatives, and campaign setup. Ad budget charging and actual spend happen directly on each platform (Meta Ads, Google Ads). No ad spend is charged through Piped.",
    loading: "Loading...",
    connectionFailed: "Connection failed",
  },
  campaigns: {
    title: "Campaigns",
    dashboard: "Campaign Dashboard",
    newCampaign: "New Project",
    noCampaigns: "No projects yet",
    noCampaignsDesc: "Create your first ad campaign.",
    createFirst: "Create Campaign",
    platform: "Platform",
    choosePlatform: "Choose Platform",
    content: "Content",
    selectAdCopy: "Select Ad Copy",
    noCopy: "No copy generated yet. Please generate copy first.",
    selectCreative: "Select Creative",
    noCreative: "No creatives generated yet. Please create creatives first.",
    selected: "Selected",
    targeting: "Targeting",
    minAge: "Min Age",
    maxAge: "Max Age",
    locations: "Locations (comma-separated country codes)",
    interests: "Interests (optional)",
    budget: "Budget",
    campaignName: "Campaign Name",
    dailyBudget: "Daily Budget (USD)",
    monthlyEstimate: "Estimated monthly spend",
    review: "Review",
    reviewCampaign: "Review Campaign",
    statusPaused: "Will be created as PAUSED",
    createCampaign: "Create Campaign",
    created: "Campaign created successfully!",
    creationFailed: "Campaign creation failed",
    back: "Back",
    next: "Next",
    refreshMetrics: "Refresh Metrics",
    campaignList: "Campaign List",
    totalImpressions: "Total Impressions",
    totalClicks: "Total Clicks",
    totalSpend: "Total Spend",
    impressions: "Impressions",
    clicks: "Clicks",
    spend: "Spend",
    ctr: "CTR",
    cpc: "CPC",
    roas: "ROAS",
    conversions: "Conversions",
    pause: "Pause",
    resume: "Resume",
    metricsUpdated: "Metrics updated",
    metricsUpdateFailed: "Failed to update metrics",
    adStarted: "Ad started",
    adPaused: "Ad paused",
    adStatusFailed: "Failed to change ad status",
    goalAndCommission: "Goal & Commission Setup",
    goalLabel: "Performance Goal",
    visits: "Visits",
    visitsDesc: "Commission per click",
    signups: "Signups",
    signupsDesc: "Commission per signup",
    purchases: "Purchases",
    purchasesDesc: "Commission per purchase",
    recommended: "Recommended",
    commissionType: "Commission Type",
    fixedAmount: "Fixed Amount ($)",
    percentage: "Percentage (%)",
    commissionLabel: "Commission",
    cookieDuration: "Cookie Duration (days)",
    estimatedCost: "Estimated Cost",
    influencerBudget: "Influencer Campaign Budget",
    totalBudget: "Total Budget (USD)",
    budgetExhausted: "Campaign auto-pauses when budget is exhausted",
    trackingMetrics: "Tracking Metrics",
    referralClicks: "Referral Clicks",
    uniqueVisitors: "Unique Visitors",
    signupConversions: "Signup Conversions",
    purchaseConversions: "Purchase Conversions",
    conversionRate: "Conversion Rate (CVR)",
    performanceByInfluencer: "Performance by Influencer",
    commissionStatus: "Commission Payout Status",
    roi: "ROI",
    campaignReview: "Campaign Review",
    type: "Type",
    goal: "Goal",
    commissionPerAction: "Commission per action",
    cookiePeriod: "Cookie Period",
    status: "Status",
    autoCreateAffiliate: "Auto-create affiliate program",
    createdAsPaused: "Created as PAUSED",
    targetInfo: "Target",
    influencerCreated: "Influencer campaign created!",
    signupTrackingGuide: "Signup Tracking Guide",
    purchaseTrackingGuide: "Purchase Tracking Guide",
    autoTracked: "Auto-tracked: Users who sign up via Piped are tracked by referral cookie.",
    externalSignupTracking: "External signup tracking: Add this code to your signup completion page:",
    externalPurchaseTracking: "External payment tracking: Call this on payment completion:",
    cookieAutoRead: "The referral cookie (piped_ref) is read automatically to attribute commissions.",
    claudeCodeGuide: "Using Claude Code?",
    claudeCodeTrackingDesc: "Tell Claude Code to add tracking to your project:",
    nextAffiliates: "Next: Affiliate Program",
    nextAffiliatesDesc: "Influencers promote your product and earn commissions",
  },
  affiliates: {
    browseTitle: "Browse Affiliate Programs",
    browseDesc: "Find products to promote and earn commissions.",
    myPrograms: "My Programs",
    earnings: "Earnings",
    totalEarnings: "Total Earnings",
    commission: "Commission",
    cookieDays: "Cookie Duration",
    affiliateCount: "Affiliates",
    joinProgram: "Join Program",
    switchToJoin: "Switch to Influencer mode to join",
    joined: "Joined",
    yourLink: "Your Affiliate Link",
    clicks: "Clicks",
    conversions: "Conversions",
    noPrograms: "No programs available",
  },
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    notAuthenticated: "Not authenticated",
    waiting: "Waiting",
    next: "Next",
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    continue: "Continue",
    delete: "Delete",
    confirm: "Confirm",
    credits: "Credits",
    creditsPerUnit: "per credit",
    popular: "Popular",
    processing: "Processing...",
  },
};

const ko: AppText = {
  auth: {
    welcomeBack: "돌아오신 것을 환영합니다",
    signInDesc: "Piped 계정에 로그인하세요",
    createAccount: "계정 만들기",
    signUpDesc: "몇 분 만에 AI 광고 이미지를 만들어보세요",
    email: "이메일",
    password: "비밀번호",
    displayName: "이름",
    signIn: "로그인",
    signUp: "계정 만들기",
    continueWithGoogle: "Google로 계속하기",
    noAccount: "계정이 없으신가요?",
    hasAccount: "이미 계정이 있으신가요?",
    invalidCredentials: "이메일 또는 비밀번호가 잘못되었습니다",
    signUpFailed: "계정 생성에 실패했습니다. 이미 사용 중인 이메일일 수 있습니다.",
    googleFailed: "Google 로그인에 실패했습니다",
    passwordMin: "비밀번호는 최소 6자 이상이어야 합니다",
  },
  onboarding: {
    title: "역할을 선택하세요",
    subtitle: "Piped를 어떻게 사용하실 건가요?",
    owner: "메이커",
    ownerDesc: "제품이나 서비스를 위한 AI 광고 이미지를 만들고 싶습니다.",
    influencer: "인플루언서",
    influencerDesc: "좋은 제품을 발견하고, 홍보하여 커미션을 받고 싶습니다.",
    continue: "계속하기",
    selectRole: "역할을 선택해주세요",
  },
  sidebar: {
    dashboard: "대시보드",
    campaigns: "캠페인",
    creatives: "광고 소재",
    reports: "리포트",
    projects: "프로젝트",
    browsePrograms: "프로그램 둘러보기",
    partnerHub: "파트너 허브",
    myPrograms: "내 프로그램",
    earnings: "수익",
    settings: "설정",
    signOut: "로그아웃",
    productOwner: "메이커",
    influencer: "인플루언서",
  },
  dashboard: {
    title: "대시보드",
    welcomeBack: "돌아오셨군요",
    newProject: "새 프로젝트",
    recentProjects: "최근 프로젝트",
    noProjects: "프로젝트가 없습니다",
    noProjectsDesc: "첫 번째 프로젝트를 만들어 AI 광고 이미지를 생성하세요.",
    createProject: "캠페인 만들기",
    projectCount: "프로젝트",
    campaignCount: "이미지",
    affiliateCount: "제휴",
    welcomeInfluencer: "환영합니다",
    influencerDesc: "제품을 발견하고 커미션을 받으세요.",
    browsePrograms: "프로그램 둘러보기",
    findProducts: "홍보할 제품 찾기",
    myEarnings: "내 수익",
    trackCommissions: "커미션 추적",
    deleteConfirm: '"{name}" 캠페인을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
    deleted: "프로젝트가 삭제되었습니다",
    deleteFailed: "삭제에 실패했습니다",
  },
  projects: {
    title: "새 프로젝트",
    newProject: "새 프로젝트",
    enterUrl: "제품 URL을 입력하세요",
    enterUrlDesc: "AI가 페이지를 분석하고 광고 이미지를 만들어줍니다",
    urlPlaceholder: "https://your-product.com",
    startPipeline: "광고 이미지 생성",
    creating: "프로젝트 생성중...",
    crawling: "웹사이트 크롤링중...",
    analyzed: "웹사이트 분석 완료!",
    analysisFailed: "분석에 실패했습니다",
    fetchingContent: "페이지 콘텐츠 가져오는 중",
    extractingMeta: "텍스트 및 메타데이터 추출 중",
    analyzingBrand: "AI가 브랜드 분석 중",
    chooseCampaignType: "캠페인 유형 선택",
    campaignType: "캠페인 유형",
    websiteUrl: "웹사이트 입력",
    changeCampaignType: "캠페인 유형 변경",
    notEnoughCredits: "크레딧이 부족합니다",
    notEnoughCreditsDesc: "프로젝트를 진행하려면 최소 {min} 크레딧이 필요합니다. 현재 잔액: {current}",
    buyCredits: "크레딧 충전하기",
    stageAnalyzing: "분석중",
    stageCopy: "문구 완료",
    stageCreatives: "크리에이티브",
    stageCampaigns: "캠페인",
    stageAffiliates: "제휴",
  },
  projectDetail: {
    pipelineProgress: "파이프라인 진행 상황",
    analysisResult: "분석 결과",
    product: "제품",
    audience: "타겟 고객",
    features: "핵심 기능",
    toneAndIndustry: "톤 & 산업",
    brandColors: "브랜드 컬러",
    generateCopy: "마케팅 문구 생성",
    generateCopyDesc: "AI 기반 헤드라인, 설명, 광고 카피",
    createCreatives: "광고 크리에이티브 제작",
    createCreativesDesc: "모든 플랫폼용 비주얼 제작",
    videoProduction: "영상 제작",
    videoProductionDesc: "광고 이미지를 AI 영상으로 변환",
    launchCampaigns: "캠페인 런칭",
    launchCampaignsDesc: "Meta & Google Ads에 배포",
    affiliateProgram: "제휴 프로그램",
    affiliateProgramDesc: "인플루언서가 제품을 홍보",
    completed: "완료",
    currentStep: "현재 단계",
    clickToEdit: "클릭하여 수정하거나 다시 생성할 수 있습니다",
  },
  copy: {
    title: "마케팅 문구",
    subtitle: "대상 국가와 언어를 선택하면 바로 마케팅 문구를 생성합니다",
    selectCountry: "대상 국가",
    selectLanguage: "광고 언어",
    generateButton: "마케팅 문구 생성하기",
    generating: "마케팅 문구 생성 중...",
    generatingDesc: "헤드라인, 설명, 광고 카피, 소셜 포스트 생성 중",
    generated: "마케팅 문구가 생성되었습니다!",
    regenerateAll: "전체 재생성",
    nextCreatives: "다음: 광고 크리에이티브 제작",
    nextCreativesDesc: "AI 기반 비주얼 제작",
    continue: "계속",
    headlines: "헤드라인",
    shortDesc: "짧은 설명",
    longDesc: "긴 설명",
    metaAds: "Meta 광고",
    googleAds: "Google 광고",
    socialPosts: "소셜 포스트",
    ctas: "CTA",
    edited: "수정됨",
    copyUpdated: "문구가 수정되었습니다",
    save: "저장",
    cancel: "취소",
    edit: "수정",
    generatingHeadlines: "헤드라인 생성중",
    generatingDescs: "설명 생성중",
    generatingAdCopy: "광고 카피 생성중",
    generatingSocial: "소셜 포스트 생성중",
  },
  creatives: {
    title: "광고 크리에이티브",
    whatToCreate: "어떤 콘텐츠를 만들까요?",
    imageAd: "이미지 광고",
    imageAdDesc: "Instagram, Facebook, Google 용 정적 이미지 광고를 만듭니다.",
    imageAdDetail: "AI 이미지 생성 + 텍스트 오버레이 + 5개 포맷 자동 변환",
    videoAd: "영상 광고",
    videoAdDesc: "이미지를 기반으로 5초 모션 영상을 만듭니다.",
    videoAdDetail: "Google Veo AI로 시네마틱 모션 생성",
    selectConcept: "어떤 컨셉으로 후킹할지 선택하세요",
    selectSubject: "광고 주인공",
    selectCopy: "마케팅 문구 선택",
    selectCopyDesc: "이미지에 넣을 후킹 문구를 선택하세요",
    customInput: "직접 입력",
    customPlaceholder: "이미지에 표시할 마케팅 문구를 입력하세요",
    charLimit: "짧고 강렬할수록 후킹 효과가 높아요",
    previousCopy: "이전에 생성한 마케팅 문구",
    noCopy: "아직 생성된 마케팅 문구가 없습니다",
    noCopyDesc: "직접 입력하거나, Copy 단계에서 먼저 문구를 생성하세요",
    autoFallback: "문구 미선택 시 제품 가치 제안이 자동으로 사용됩니다",
    generateButton: "이미지 생성하기",
    generating: "생성중",
    elapsed: "초 경과",
    waitMore: " — 조금만 더 기다려주세요",
    skip: "건너뛰기",
    failed: "생성 실패",
    failedDesc: "타임아웃 또는 오류가 발생했습니다",
    retry: "재시도",
    reselect: "다시 선택",
    regenerate: "재생성",
    allGenerated: "모든 이미지가 생성되었습니다!",
    partialGenerated: "일부 이미지가 생성되었습니다. 실패한 항목은 재시도할 수 있습니다.",
    allFailed: "이미지 생성에 실패했습니다. 다시 시도해주세요.",
    nextCampaigns: "다음: 캠페인 런칭",
    nextCampaignsDesc: "Meta 또는 Google Ads에 캠페인 설정",
    changeImage: "이미지 변경",
    selectImage: "이미지 선택",
    videoGenerating: "영상 생성중...",
    videoCredits: "영상 만들기 (30 크레딧)",
  },
  settings: {
    title: "설정",
    profile: "프로필",
    role: "역할",
    saveChanges: "변경사항 저장",
    profileUpdated: "프로필이 업데이트되었습니다",
    updateFailed: "프로필 업데이트에 실패했습니다",
    integrations: "광고 플랫폼 연동",
    metaAds: "Meta Ads",
    metaAdsDesc: "Facebook & Instagram 광고",
    googleAds: "Google Ads",
    googleAdsDesc: "검색 & 디스플레이 광고",
    connected: "연결됨",
    connect: "연결",
    disconnect: "연결 해제",
    disconnected: "Google Ads 연결이 해제되었습니다",
    connectFailed: "연결에 실패했습니다",
    googleConnected: "Google Ads 계정이 연결되었습니다!",
    googleFailed: "Google Ads 연결 실패",
    metaConnected: "Meta Ads 계정이 연결되었습니다!",
    metaFailed: "Meta Ads 연결 실패",
    security: "보안",
    resetPassword: "비밀번호 재설정",
    resetSent: "비밀번호 재설정 이메일을 보냈습니다!",
    creditsTitle: "크레딧",
    creditsUnit: "크레딧",
    perCredit: "크레딧당",
    receiptEmail: "영수증 이메일",
    agreeTermsLabel: "동의합니다",
    termsLink: "이용약관",
    privacyLink: "개인정보처리방침",
    agreeRefundLabel: "크레딧은 디지털 상품으로 구매 즉시 충전되며, 환불이 불가함을 확인합니다.",
    payCard: "카드로 결제하기",
    payCrypto: "크립토로 결제하기",
    cryptoOff: "5% OFF",
    cryptoNetworks: "크립토: Ethereum · Arbitrum · Base · BSC (USDT/USDC)",
    creditUsage: "크레딧 소모량",
    siteAnalysis: "사이트 분석: 5",
    copyGeneration: "카피 생성: 10",
    imageGraphic: "이미지 (그래픽): 5",
    imageAi: "이미지 (AI): 15",
    videoGeneration: "영상 생성: 30",
    campaignCreation: "캠페인 생성: 5",
    creditCharged: "크레딧이 충전되었습니다!",
    chargeFailed: "충전에 실패했습니다",
    paymentCancelled: "결제가 취소되었습니다",
    payoutTitle: "정산 수령 주소",
    payoutDesc: "제휴 수익을 수령할 크립토 지갑 주소를 입력하세요",
    network: "네트워크",
    walletAddress: "지갑 주소",
    walletPlaceholder: "0x... 또는 지갑 주소 입력",
    walletSaved: "지갑 주소가 저장되었습니다",
    saveFailed: "저장 실패",
    integrationsInfo: "Piped는 AI 기반 광고 카피·크리에이티브 생성과 캠페인 설정을 자동화합니다. 광고 예산 충전 및 실제 비용 집행은 각 플랫폼(Meta Ads, Google Ads)에서 직접 이루어지며, Piped를 통해 광고비가 결제되지 않습니다.",
    loading: "로딩중...",
    connectionFailed: "연결에 실패했습니다",
  },
  campaigns: {
    title: "캠페인",
    dashboard: "캠페인 대시보드",
    newCampaign: "새 프로젝트",
    noCampaigns: "프로젝트가 없습니다",
    noCampaignsDesc: "첫 번째 광고 캠페인을 만들어보세요.",
    createFirst: "캠페인 만들기",
    platform: "플랫폼",
    choosePlatform: "플랫폼 선택",
    content: "콘텐츠",
    selectAdCopy: "광고 문구 선택",
    noCopy: "생성된 카피가 없습니다. 먼저 Copy 단계에서 문구를 생성하세요.",
    selectCreative: "크리에이티브 선택",
    noCreative: "생성된 크리에이티브가 없습니다. 먼저 크리에이티브를 생성하세요.",
    selected: "선택됨",
    targeting: "타겟팅",
    minAge: "최소 연령",
    maxAge: "최대 연령",
    locations: "지역 (쉼표로 구분된 국가 코드)",
    interests: "관심사 (선택사항)",
    budget: "예산",
    campaignName: "캠페인 이름",
    dailyBudget: "일일 예산 (USD)",
    monthlyEstimate: "예상 월간 지출",
    review: "검토",
    reviewCampaign: "캠페인 검토",
    statusPaused: "일시정지 상태로 생성됩니다",
    createCampaign: "캠페인 생성",
    created: "캠페인이 생성되었습니다!",
    creationFailed: "캠페인 생성에 실패했습니다",
    back: "뒤로",
    next: "다음",
    refreshMetrics: "지표 새로고침",
    campaignList: "캠페인 목록",
    totalImpressions: "총 노출수",
    totalClicks: "총 클릭수",
    totalSpend: "총 지출",
    impressions: "노출",
    clicks: "클릭",
    spend: "지출",
    ctr: "CTR",
    cpc: "CPC",
    roas: "ROAS",
    conversions: "전환",
    pause: "중지",
    resume: "시작",
    metricsUpdated: "지표가 업데이트되었습니다",
    metricsUpdateFailed: "지표 업데이트 실패",
    adStarted: "광고가 시작되었습니다",
    adPaused: "광고가 중지되었습니다",
    adStatusFailed: "광고 상태 변경 실패",
    goalAndCommission: "성과 목표 & 커미션 설정",
    goalLabel: "성과 목표",
    visits: "방문",
    visitsDesc: "링크 클릭당 커미션",
    signups: "가입",
    signupsDesc: "회원가입당 커미션",
    purchases: "구매",
    purchasesDesc: "구매 전환당 커미션",
    recommended: "추천",
    commissionType: "커미션 유형",
    fixedAmount: "고정 금액 ($)",
    percentage: "비율 (%)",
    commissionLabel: "커미션",
    cookieDuration: "쿠키 유효 기간 (일)",
    estimatedCost: "예상 비용",
    influencerBudget: "인플루언서 캠페인 예산",
    totalBudget: "총 예산 (USD)",
    budgetExhausted: "예산 소진 시 캠페인이 자동 중지됩니다",
    trackingMetrics: "추적 지표",
    referralClicks: "레퍼럴 클릭 수",
    uniqueVisitors: "고유 방문자 수",
    signupConversions: "회원가입 전환",
    purchaseConversions: "구매 전환",
    conversionRate: "전환율 (CVR)",
    performanceByInfluencer: "인플루언서별 성과",
    commissionStatus: "커미션 지급 현황",
    roi: "ROI (투자 대비 수익)",
    campaignReview: "캠페인 확인",
    type: "유형",
    goal: "성과 목표",
    commissionPerAction: "건당 커미션",
    cookiePeriod: "쿠키 기간",
    status: "상태",
    autoCreateAffiliate: "제휴 프로그램 자동 생성",
    createdAsPaused: "PAUSED로 생성",
    targetInfo: "타겟",
    influencerCreated: "인플루언서 캠페인이 생성되었습니다!",
    signupTrackingGuide: "가입 추적 설정 안내",
    purchaseTrackingGuide: "구매 추적 설정 안내",
    autoTracked: "자동 추적됨: Piped를 통해 가입한 유저는 레퍼럴 쿠키로 자동 추적됩니다.",
    externalSignupTracking: "외부 서비스 가입 추적: 가입 완료 페이지에 아래 코드를 추가하세요:",
    externalPurchaseTracking: "외부 결제 추적: 결제 완료 시 아래 코드를 호출하세요:",
    cookieAutoRead: "레퍼럴 쿠키 (piped_ref)가 자동으로 읽혀서 인플루언서에게 커미션이 지급됩니다.",
    claudeCodeGuide: "Claude Code를 사용하시나요?",
    claudeCodeTrackingDesc: "Claude Code에 이렇게 명령하세요:",
    nextAffiliates: "다음: 제휴 프로그램",
    nextAffiliatesDesc: "인플루언서가 제품을 홍보하고 커미션을 받습니다",
  },
  affiliates: {
    browseTitle: "제휴 프로그램 둘러보기",
    browseDesc: "제품을 홍보하고 커미션을 받으세요.",
    myPrograms: "내 프로그램",
    earnings: "수익",
    totalEarnings: "총 수익",
    commission: "커미션",
    cookieDays: "쿠키 기간",
    affiliateCount: "제휴 파트너",
    joinProgram: "프로그램 참여",
    switchToJoin: "인플루언서 모드로 전환하여 참여하세요",
    joined: "참여 완료",
    yourLink: "제휴 링크",
    clicks: "클릭",
    conversions: "전환",
    noPrograms: "이용 가능한 프로그램이 없습니다",
  },
  common: {
    loading: "로딩중...",
    error: "오류",
    success: "성공",
    notAuthenticated: "인증되지 않았습니다",
    waiting: "대기중",
    next: "다음",
    back: "뒤로",
    save: "저장",
    cancel: "취소",
    continue: "계속",
    delete: "삭제",
    confirm: "확인",
    credits: "크레딧",
    creditsPerUnit: "크레딧당",
    popular: "인기",
    processing: "처리중...",
  },
};

const ja: AppText = {
  ...structuredClone(en),
  auth: {
    ...en.auth,
    welcomeBack: "おかえりなさい",
    signInDesc: "Pipedアカウントにログイン",
    createAccount: "アカウント作成",
    signUpDesc: "数分でマーケティング自動化を開始",
    email: "メール",
    password: "パスワード",
    displayName: "表示名",
    signIn: "ログイン",
    signUp: "アカウント作成",
    continueWithGoogle: "Googleで続ける",
    noAccount: "アカウントをお持ちでないですか？",
    hasAccount: "すでにアカウントをお持ちですか？",
  },
  onboarding: {
    ...en.onboarding,
    title: "役割を選択",
    subtitle: "Pipedをどのように使いますか？",
    owner: "メーカー",
    ownerDesc: "プロダクトを作り、AIでマーケティングを自動化したい。",
    influencer: "インフルエンサー",
    influencerDesc: "良い製品を見つけて宣伝し、コミッションを得たい。",
    continue: "続ける",
  },
  sidebar: { ...en.sidebar, dashboard: "ダッシュボード", projects: "プロジェクト", settings: "設定", signOut: "ログアウト" },
  common: { ...en.common, loading: "読み込み中...", waiting: "待機中" },
};

const zh: AppText = {
  ...structuredClone(en),
  auth: {
    ...en.auth,
    welcomeBack: "欢迎回来",
    signInDesc: "登录您的Piped账户",
    createAccount: "创建账户",
    signUpDesc: "几分钟内开始营销自动化",
    email: "邮箱",
    password: "密码",
    displayName: "显示名称",
    signIn: "登录",
    signUp: "创建账户",
    continueWithGoogle: "使用Google继续",
    noAccount: "没有账户？",
    hasAccount: "已有账户？",
  },
  onboarding: {
    ...en.onboarding,
    title: "选择角色",
    subtitle: "您将如何使用Piped？",
    owner: "创客",
    ownerDesc: "我创建了产品，想用AI自动化营销。",
    influencer: "网红",
    influencerDesc: "我想发现好产品进行推广并赚取佣金。",
    continue: "继续",
  },
  sidebar: { ...en.sidebar, dashboard: "仪表盘", projects: "项目", settings: "设置", signOut: "退出" },
  common: { ...en.common, loading: "加载中...", waiting: "等待中" },
};

const appTranslations: Record<string, AppText> = { en, ko, ja, zh };

export function getAppText(locale: string): AppText {
  const key = locale.split("-")[0].toLowerCase();
  return appTranslations[key] || en;
}
