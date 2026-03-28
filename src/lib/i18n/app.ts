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
    projects: string;
    browsePrograms: string;
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
  };
  // Project detail
  projectDetail: {
    pipelineProgress: string;
    analysisResult: string;
    product: string;
    audience: string;
    features: string;
    generateCopy: string;
    generateCopyDesc: string;
    createCreatives: string;
    createCreativesDesc: string;
    launchCampaigns: string;
    launchCampaignsDesc: string;
    affiliateProgram: string;
    affiliateProgramDesc: string;
  };
  // Copy
  copy: {
    title: string;
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
  };
  // Creatives
  creatives: {
    title: string;
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
    security: string;
    resetPassword: string;
    resetSent: string;
  };
  // Campaigns
  campaigns: {
    title: string;
    newCampaign: string;
    noCampaigns: string;
    noCampaignsDesc: string;
    platform: string;
    choosePlatform: string;
    content: string;
    selectAdCopy: string;
    selectCreative: string;
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
  };
}

const en: AppText = {
  auth: {
    welcomeBack: "Welcome back",
    signInDesc: "Sign in to your Piped account",
    createAccount: "Create your account",
    signUpDesc: "Start automating your marketing in minutes",
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
    owner: "Product Owner",
    ownerDesc: "I built a product and want to automate marketing with AI-generated copy, creatives, and ad campaigns.",
    influencer: "Influencer",
    influencerDesc: "I want to discover great products, promote them to my audience, and earn commissions.",
    continue: "Continue",
    selectRole: "Please select a role",
  },
  sidebar: {
    dashboard: "Dashboard",
    projects: "Projects",
    browsePrograms: "Browse Programs",
    myPrograms: "My Programs",
    earnings: "Earnings",
    settings: "Settings",
    signOut: "Sign Out",
    productOwner: "Product Owner",
    influencer: "Influencer",
  },
  dashboard: {
    title: "Dashboard",
    welcomeBack: "Welcome back",
    newProject: "New Project",
    recentProjects: "Recent Projects",
    noProjects: "No projects yet",
    noProjectsDesc: "Create your first project to start the marketing pipeline.",
    createProject: "Create Project",
    projectCount: "Projects",
    campaignCount: "Campaigns",
    affiliateCount: "Affiliates",
    welcomeInfluencer: "Welcome",
    influencerDesc: "Discover products to promote and earn commissions.",
    browsePrograms: "Browse Programs",
    findProducts: "Find products to promote",
    myEarnings: "My Earnings",
    trackCommissions: "Track your commissions",
    deleteConfirm: 'Delete project "{name}"? This cannot be undone.',
    deleted: "Project deleted",
    deleteFailed: "Failed to delete",
  },
  projects: {
    title: "New Project",
    newProject: "New Project",
    enterUrl: "Enter your website URL",
    enterUrlDesc: "We'll crawl and analyze your page with AI",
    urlPlaceholder: "https://your-product.com",
    startPipeline: "Start Pipeline",
    creating: "Creating project...",
    crawling: "Crawling website...",
    analyzed: "Website analyzed successfully!",
    analysisFailed: "Analysis failed",
    fetchingContent: "Fetching page content",
    extractingMeta: "Extracting text and metadata",
    analyzingBrand: "AI analyzing your brand",
  },
  projectDetail: {
    pipelineProgress: "Pipeline Progress",
    analysisResult: "Analysis Result",
    product: "Product",
    audience: "Target Audience",
    features: "Key Features",
    generateCopy: "Generate Marketing Copy",
    generateCopyDesc: "AI-powered headlines, descriptions, and ad copy",
    createCreatives: "Create Ad Creatives",
    createCreativesDesc: "Stunning visuals for every platform",
    launchCampaigns: "Launch Campaigns",
    launchCampaignsDesc: "Deploy to Meta & Google Ads",
    affiliateProgram: "Affiliate Program",
    affiliateProgramDesc: "Let influencers promote your product",
  },
  copy: {
    title: "Marketing Copy",
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
  },
  creatives: {
    title: "Ad Creatives",
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
    security: "Security",
    resetPassword: "Reset Password",
    resetSent: "Password reset email sent!",
  },
  campaigns: {
    title: "Campaigns",
    newCampaign: "New Campaign",
    noCampaigns: "No campaigns yet",
    noCampaignsDesc: "Create your first ad campaign.",
    platform: "Platform",
    choosePlatform: "Choose Platform",
    content: "Content",
    selectAdCopy: "Select Ad Copy",
    selectCreative: "Select Creative",
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
  },
};

const ko: AppText = {
  auth: {
    welcomeBack: "돌아오신 것을 환영합니다",
    signInDesc: "Piped 계정에 로그인하세요",
    createAccount: "계정 만들기",
    signUpDesc: "몇 분 만에 마케팅 자동화를 시작하세요",
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
    owner: "프로덕트 오너",
    ownerDesc: "제품을 만들었고, AI 기반 마케팅 자동화(카피, 크리에이티브, 광고 캠페인)를 원합니다.",
    influencer: "인플루언서",
    influencerDesc: "좋은 제품을 발견하고, 홍보하여 커미션을 받고 싶습니다.",
    continue: "계속하기",
    selectRole: "역할을 선택해주세요",
  },
  sidebar: {
    dashboard: "대시보드",
    projects: "프로젝트",
    browsePrograms: "프로그램 둘러보기",
    myPrograms: "내 프로그램",
    earnings: "수익",
    settings: "설정",
    signOut: "로그아웃",
    productOwner: "프로덕트 오너",
    influencer: "인플루언서",
  },
  dashboard: {
    title: "대시보드",
    welcomeBack: "돌아오셨군요",
    newProject: "새 프로젝트",
    recentProjects: "최근 프로젝트",
    noProjects: "프로젝트가 없습니다",
    noProjectsDesc: "첫 번째 프로젝트를 만들어 마케팅 파이프라인을 시작하세요.",
    createProject: "프로젝트 만들기",
    projectCount: "프로젝트",
    campaignCount: "캠페인",
    affiliateCount: "제휴",
    welcomeInfluencer: "환영합니다",
    influencerDesc: "제품을 발견하고 커미션을 받으세요.",
    browsePrograms: "프로그램 둘러보기",
    findProducts: "홍보할 제품 찾기",
    myEarnings: "내 수익",
    trackCommissions: "커미션 추적",
    deleteConfirm: '"{name}" 프로젝트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
    deleted: "프로젝트가 삭제되었습니다",
    deleteFailed: "삭제에 실패했습니다",
  },
  projects: {
    title: "새 프로젝트",
    newProject: "새 프로젝트",
    enterUrl: "웹사이트 URL을 입력하세요",
    enterUrlDesc: "AI가 페이지를 크롤링하고 분석합니다",
    urlPlaceholder: "https://your-product.com",
    startPipeline: "파이프라인 시작",
    creating: "프로젝트 생성중...",
    crawling: "웹사이트 크롤링중...",
    analyzed: "웹사이트 분석 완료!",
    analysisFailed: "분석에 실패했습니다",
    fetchingContent: "페이지 콘텐츠 가져오는 중",
    extractingMeta: "텍스트 및 메타데이터 추출 중",
    analyzingBrand: "AI가 브랜드 분석 중",
  },
  projectDetail: {
    pipelineProgress: "파이프라인 진행 상황",
    analysisResult: "분석 결과",
    product: "제품",
    audience: "타겟 고객",
    features: "핵심 기능",
    generateCopy: "마케팅 문구 생성",
    generateCopyDesc: "AI 기반 헤드라인, 설명, 광고 카피",
    createCreatives: "광고 크리에이티브 제작",
    createCreativesDesc: "모든 플랫폼용 비주얼 제작",
    launchCampaigns: "캠페인 런칭",
    launchCampaignsDesc: "Meta & Google Ads에 배포",
    affiliateProgram: "제휴 프로그램",
    affiliateProgramDesc: "인플루언서가 제품을 홍보",
  },
  copy: {
    title: "마케팅 문구",
    selectCountry: "대상 국가",
    selectLanguage: "광고 언어",
    generateButton: "마케팅 문구 생성하기",
    generating: "마케팅 문구 생성 중...",
    generatingDesc: "Headlines, Descriptions, Ad Copy, Social Posts 생성 중",
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
  },
  creatives: {
    title: "광고 크리에이티브",
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
    security: "보안",
    resetPassword: "비밀번호 재설정",
    resetSent: "비밀번호 재설정 이메일을 보냈습니다!",
  },
  campaigns: {
    title: "캠페인",
    newCampaign: "새 캠페인",
    noCampaigns: "캠페인이 없습니다",
    noCampaignsDesc: "첫 번째 광고 캠페인을 만들어보세요.",
    platform: "플랫폼",
    choosePlatform: "플랫폼 선택",
    content: "콘텐츠",
    selectAdCopy: "광고 문구 선택",
    selectCreative: "크리에이티브 선택",
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
    switchToJoin: "Influencer 모드로 전환하여 참여하세요",
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
    owner: "プロダクトオーナー",
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
    owner: "产品所有者",
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
