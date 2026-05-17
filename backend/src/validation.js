function validateAircraftPayload(payload, options = {}) {
  const blockingIssues = [];
  const warningIssues = [];

  const name = String(payload.nameZh || payload.name || "").trim();
  const aircraftType = String(payload.aircraftType || payload.type || "").trim();
  const summary = String(payload.summary || "").trim();
  const description = String(payload.description || "").trim();
  const source = String(payload.source || "").trim();
  const firstFlightYear = Number(payload.firstFlightYear || payload.firstFlight || 0);
  const rangeKm = Number(payload.rangeKm || payload.range || 0);
  const engineType = String(payload.engineType || "").trim();

  if (!name) {
    blockingIssues.push("中文名称未填写");
  }
  if (!aircraftType) {
    blockingIssues.push("机型分类未选择");
  }
  if (!summary) {
    blockingIssues.push("一句话简介未填写");
  }
  if (!description) {
    warningIssues.push("详细介绍缺失，建议补充");
  }
  if (!firstFlightYear) {
    warningIssues.push("首飞年份缺失，建议补充");
  }
  if (!rangeKm) {
    warningIssues.push("最大航程缺失，建议补充");
  }
  if (!engineType) {
    warningIssues.push("发动机类型缺失，建议补充");
  }

  if (options.requirePublishReady && !source) {
    blockingIssues.push("来源标注为空，无法满足提审要求");
  } else if (!source) {
    warningIssues.push("来源标注为空，无法满足发布要求");
  }

  return {
    passed: blockingIssues.length === 0,
    blockingIssues,
    warningIssues,
    missingFields: [
      !name ? "nameZh" : null,
      !aircraftType ? "aircraftType" : null,
      !summary ? "summary" : null,
      !description ? "description" : null,
      !firstFlightYear ? "firstFlightYear" : null,
      !rangeKm ? "rangeKm" : null,
      !engineType ? "engineType" : null,
      !source ? "source" : null
    ].filter(Boolean)
  };
}

module.exports = {
  validateAircraftPayload
};
