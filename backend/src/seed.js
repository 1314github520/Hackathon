const { hashPassword } = require("./auth");

function createSeedData() {
  const now = new Date().toISOString();

  const aircraft = [
    {
      id: "aircraft-a380",
      slug: "airbus-a380",
      nameZh: "空客 A380",
      nameEn: "Airbus A380",
      aircraftType: "客机",
      manufacturer: "空中客车",
      countryOfOrigin: "法国",
      eraLabel: "喷气时代",
      firstFlightYear: 2005,
      firstFlightDate: "2005-04-27",
      serviceEntryDate: "2007-10-25",
      status: "published",
      summary: "世界知名超大型民航客机之一，适合展示大尺寸参数与现代宽体客机设计。",
      description:
        "A380 是双层宽体远程客机，常用于展示大型机场枢纽时代、超大容量客机设计和现代民航工程能力。",
      source: "Airbus 官方资料与公开航空科普资料",
      sourceUrl: "https://www.airbus.com/",
      specSourceConfidence: "verified",
      coverImage:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=airbus%20A380%20parked%20at%20airport%20gate%2C%20cinematic%20editorial%20aviation%20photography%2C%20detailed%20fuselage%2C%20soft%20evening%20light&image_size=landscape_16_9",
      specs: {
        lengthM: 72.72,
        wingspanM: 79.75,
        heightM: 24.1,
        maxSpeedKmh: 1020,
        cruiseSpeedKmh: 945,
        rangeKm: 15200,
        engineType: "涡扇",
        engineCount: 4,
        powerplantModel: "Trent 900 / GP7200",
        passengerCapacity: 555
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: "aircraft-b747",
      slug: "boeing-747",
      nameZh: "波音 747",
      nameEn: "Boeing 747",
      aircraftType: "客机",
      manufacturer: "波音",
      countryOfOrigin: "美国",
      eraLabel: "喷气时代",
      firstFlightYear: 1969,
      firstFlightDate: "1969-02-09",
      serviceEntryDate: "1970-01-22",
      status: "published",
      summary: "经典巨型远程客机，是喷气时代商业航空发展的标志性机型。",
      description:
        "747 以大容量、长航程和长时间服役历史著称，适合讲解大型民航运输网络与喷气时代商业航空扩张。",
      source: "Boeing 官方资料与公开航空科普资料",
      sourceUrl: "https://www.boeing.com/",
      specSourceConfidence: "verified",
      coverImage:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
      specs: {
        lengthM: 70.66,
        wingspanM: 64.44,
        heightM: 19.41,
        maxSpeedKmh: 988,
        cruiseSpeedKmh: 913,
        rangeKm: 13850,
        engineType: "涡扇",
        engineCount: 4,
        powerplantModel: "CF6 / PW4000 / RB211",
        passengerCapacity: 416
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: "aircraft-concorde",
      slug: "concorde",
      nameZh: "协和式",
      nameEn: "Concorde",
      aircraftType: "客机",
      manufacturer: "英法联合研制",
      countryOfOrigin: "英国 / 法国",
      eraLabel: "喷气时代",
      firstFlightYear: 1969,
      firstFlightDate: "1969-03-02",
      serviceEntryDate: "1976-01-21",
      status: "published",
      summary: "超音速客机代表，适合展示速度与商业可持续性之间的权衡。",
      description:
        "协和式是超音速商业航空的代表机型，常用于讲解速度优势、航程限制和运营成本之间的关系。",
      source: "British Airways 公开资料与航空史资料",
      sourceUrl: "https://www.britishairways.com/",
      specSourceConfidence: "verified",
      coverImage:
        "https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1200&q=80",
      specs: {
        lengthM: 61.66,
        wingspanM: 25.6,
        heightM: 12.19,
        maxSpeedKmh: 2179,
        cruiseSpeedKmh: 2140,
        rangeKm: 7222,
        engineType: "奥林巴斯 593",
        engineCount: 4,
        powerplantModel: "Rolls-Royce/Snecma Olympus 593",
        passengerCapacity: 128
      },
      createdAt: now,
      updatedAt: now
    }
  ];

  const events = [
    {
      id: "event-jet-age",
      slug: "jet-age",
      title: "喷气时代来临",
      eventType: "技术里程碑",
      eventDate: "1949-07-27",
      locationName: "英国",
      summary: "喷气式客机和后续大型客机的发展，推动商业航空进入新阶段。",
      description:
        "从早期喷气式客机到后续大型宽体客机，喷气时代改变了航空运输速度、航线组织和乘客体验。",
      impact: "推动商业航空向更远航程、更高速度和更大运力发展。",
      relatedAircraftIds: ["aircraft-b747", "aircraft-a380", "aircraft-concorde"],
      relatedPersonIds: ["person-joe-sutter"],
      status: "published",
      createdAt: now,
      updatedAt: now
    }
  ];

  const persons = [
    {
      id: "person-joe-sutter",
      slug: "joe-sutter",
      nameZh: "乔·萨特",
      nameEn: "Joe Sutter",
      personType: "工程师",
      nationality: "美国",
      summary: "波音 747 重要设计人物之一。",
      biography:
        "乔·萨特因与波音 747 项目紧密相关而被航空爱好者熟知，常用于串联人物、机型与时代背景。",
      relatedAircraftIds: ["aircraft-b747"],
      relatedEventIds: ["event-jet-age"],
      status: "published",
      createdAt: now,
      updatedAt: now
    }
  ];

  return {
    users: [
      {
        id: "user-admin",
        username: "admin",
        passwordHash: hashPassword("Admin123!"),
        userType: "admin_user",
        status: "active",
        nickname: "本地演示管理员",
        email: "admin@flyer.local",
        phone: "",
        avatarUrl: "",
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "user-demo",
        username: "demo",
        passwordHash: hashPassword("Demo123!"),
        userType: "frontend_user",
        status: "active",
        nickname: "本地演示用户",
        email: "demo@flyer.local",
        phone: "",
        avatarUrl: "",
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now
      }
    ],
    sessions: [],
    aircraft,
    events,
    persons,
    favorites: [],
    browsingHistory: [],
    approvalWorkflows: [],
    approvalTasks: [],
    reviewComments: [],
    auditLogs: [],
    contentRevisions: []
  };
}

module.exports = {
  createSeedData
};
