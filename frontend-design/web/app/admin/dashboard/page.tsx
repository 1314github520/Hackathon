"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
import { Badge, Panel, StatCard } from "@/components/ui/panel";
import { demoAircraftPayload } from "@/data/demo";
import { api } from "@/lib/api/service";
import { isUnauthorizedError, readStoredSession, syncAdminSession, writeStoredSession } from "@/lib/session";
import type {
  AdminAircraftItem,
  Aircraft,
  AuditLog,
  DashboardSummary,
  ReviewQueueItem,
  ValidationResult,
} from "@/types/api";

type AircraftFormState = Record<string, string | number>;

const initialFormState: AircraftFormState = {
  ...demoAircraftPayload,
};

export default function AdminDashboardPage() {
  const [session, setSession] = useState(readStoredSession("admin"));
  const token = useMemo(() => session?.accessToken || null, [session]);
  const [ready, setReady] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [createdAircraft, setCreatedAircraft] = useState<Aircraft | null>(null);
  const [workflowId, setWorkflowId] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminAircraft, setAdminAircraft] = useState<AdminAircraftItem[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<AircraftFormState>(initialFormState);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const stored = readStoredSession("admin");
      if (!stored) {
        if (!cancelled) {
          setReady(true);
        }
        return;
      }

      try {
        const nextSession = await syncAdminSession(stored);
        if (cancelled) {
          return;
        }

        writeStoredSession("admin", nextSession);
        setSession(nextSession);
        setReady(true);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "管理员登录态恢复失败");
          setReady(true);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        return;
      }

      try {
        setError("");
        const [summaryResult, logsResult, aircraftResult, reviewQueueResult] = await Promise.all([
          api.adminSummary(token),
          api.auditLogs(token),
          api.adminAircraft(token),
          api.reviewQueue(token),
        ]);
        setSummary(summaryResult);
        setAuditLogs(logsResult);
        setAdminAircraft(aircraftResult);
        setReviewQueue(reviewQueueResult);
      } catch (loadError) {
        if (isUnauthorizedError(loadError)) {
          writeStoredSession("admin", null);
          setSession(null);
          setMessage("管理员登录态已失效，请重新登录。");
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "后台联调加载失败");
      }
    };

    void load();
  }, [token]);

  async function refreshDashboardData() {
    if (!token) {
      return;
    }

    const [summaryResult, logsResult, aircraftResult, reviewQueueResult] = await Promise.all([
      api.adminSummary(token),
      api.auditLogs(token),
      api.adminAircraft(token),
      api.reviewQueue(token),
    ]);
    setSummary(summaryResult);
    setAuditLogs(logsResult);
    setAdminAircraft(aircraftResult);
    setReviewQueue(reviewQueueResult);
  }

  function onFieldChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function loadAircraftAsDraft(item: AdminAircraftItem) {
    setCreatedAircraft(item);
    setForm({
      nameZh: item.nameZh || "",
      aircraftType: item.aircraftType || "",
      summary: item.summary || "",
      description: item.description || "",
      source: item.source || "",
      manufacturer: item.manufacturer || "",
      countryOfOrigin: item.countryOfOrigin || "",
      eraLabel: item.eraLabel || "",
      firstFlightYear: item.firstFlightYear || "",
      rangeKm: item.specs.rangeKm || "",
      engineType: item.specs.engineType || "",
      coverImage: item.coverImage || "",
    });
    setMessage(`已载入航空器：${item.nameZh}`);
  }

  async function onUploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      const result = await api.uploadMedia(token, file);
      setForm((current) => ({
        ...current,
        coverImage: result.path,
      }));
      setMessage(`图片上传成功：${result.originalName}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function validateForm() {
    if (!token) {
      setMessage("请先登录管理员后再执行后台联调。");
      return;
    }

    try {
      setError("");
      const result = await api.validateAircraft(token, { ...form, requirePublishReady: false });
      setValidation(result);
      setMessage(result.passed ? "字段校验通过。" : "字段校验返回了阻塞或建议补充项。");
    } catch (validateError) {
      if (isUnauthorizedError(validateError)) {
        writeStoredSession("admin", null);
        setSession(null);
        setMessage("管理员登录态已失效，请重新登录。");
        return;
      }
      setError(validateError instanceof Error ? validateError.message : "校验失败");
    }
  }

  async function createAircraft() {
    if (!token) {
      setMessage("请先登录管理员后再创建内容。");
      return;
    }

    try {
      setError("");
      const result = await api.createAircraft(token, form);
      setCreatedAircraft(result);
      setMessage(`已创建航空器：${result.nameZh}`);
      await refreshDashboardData();
    } catch (createError) {
      if (isUnauthorizedError(createError)) {
        writeStoredSession("admin", null);
        setSession(null);
        setMessage("管理员登录态已失效，请重新登录。");
        return;
      }
      setError(createError instanceof Error ? createError.message : "创建航空器失败");
    }
  }

  async function updateAircraft() {
    if (!token || !createdAircraft) {
      setMessage("请先创建航空器后再验证更新接口。");
      return;
    }

    try {
      setError("");
      const result = await api.updateAircraft(token, createdAircraft.id, form);
      setCreatedAircraft(result);
      setMessage(`已更新航空器：${result.nameZh}`);
      await refreshDashboardData();
    } catch (updateError) {
      if (isUnauthorizedError(updateError)) {
        writeStoredSession("admin", null);
        setSession(null);
        setMessage("管理员登录态已失效，请重新登录。");
        return;
      }
      setError(updateError instanceof Error ? updateError.message : "更新航空器失败");
    }
  }

  async function submitReview() {
    if (!token || !createdAircraft) {
      setMessage("请先完成创建后再提审。");
      return;
    }

    try {
      setError("");
      const result = await api.submitReview(token, "aircraft", createdAircraft.id);
      const nextWorkflowId = String((result.workflow as { id?: string })?.id || "");
      setWorkflowId(nextWorkflowId);
      setMessage(`提审成功，工作流 ID：${nextWorkflowId}`);
      await refreshDashboardData();
    } catch (reviewError) {
      if (isUnauthorizedError(reviewError)) {
        writeStoredSession("admin", null);
        setSession(null);
        setMessage("管理员登录态已失效，请重新登录。");
        return;
      }
      setError(reviewError instanceof Error ? reviewError.message : "提审失败");
    }
  }

  async function approveOrReject(decision: "approve" | "reject") {
    if (!token || !workflowId) {
      setMessage("当前没有可处理的 workflowId。");
      return;
    }

    try {
      setError("");
      if (decision === "approve") {
        await api.approveReview(token, workflowId, "联调验证通过");
        setMessage("已完成审核通过联调。");
      } else {
        await api.rejectReview(token, workflowId, "联调验证：演示驳回路径");
        setMessage("已完成审核驳回联调。");
      }
      await refreshDashboardData();
    } catch (decisionError) {
      if (isUnauthorizedError(decisionError)) {
        writeStoredSession("admin", null);
        setSession(null);
        setMessage("管理员登录态已失效，请重新登录。");
        return;
      }
      setError(decisionError instanceof Error ? decisionError.message : "审核操作失败");
    }
  }

  if (!ready) {
    return <AppShell title="后台联调" subtitle="正在恢复管理员登录态..." />;
  }

  if (!session) {
    return (
      <AppShell title="后台联调" subtitle="需要管理员登录后才能调用后台摘要、校验、创建和审核接口。">
        <Panel title="未登录" kicker="管理员鉴权">
          <p className="text-sm text-[var(--muted)]">请先进入管理员登录页，获取 accessToken 后再继续联调。</p>
          <Link href="/admin/login" className="action-button mt-4">
            去管理员登录
          </Link>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="后台管理"
      subtitle="面向内容录入和审核演示的后台页面，突出字段校验、创建条目和审核流程。"
      actions={workflowId ? <Badge>{workflowId}</Badge> : null}
    >
      {message ? <p className="status-success">{message}</p> : null}
      {error ? <p className="status-error">{error}</p> : null}
      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="已发布条目" value={String(summary.publishedCount)} />
          <StatCard label="缺失字段数" value={String(summary.missingFieldCount)} tone="warning" />
          <StatCard label="待审核任务" value={String(summary.reviewPendingCount)} />
          <StatCard label="本周修复率" value={summary.weeklyFixRate} tone="success" />
        </div>
      ) : null}

      <div className="two-column">
        <Panel title="航空器表单联调" kicker="校验 + 创建 + 提审">
          <CoverImage
            src={typeof form.coverImage === "string" ? form.coverImage : ""}
            alt={String(form.nameZh || "航空器封面")}
            label="封面图预览"
            className="mb-4 aspect-[16/8]"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(form).map(([key, value]) => (
              <label key={key} className={`form-field ${key === "description" || key === "summary" ? "md:col-span-2" : ""}`}>
                <span className="text-sm text-[var(--muted)]">{key}</span>
                {key === "description" || key === "summary" ? (
                  <textarea className="input-base min-h-28" name={key} value={String(value)} onChange={onFieldChange} />
                ) : (
                  <input className="input-base" name={key} value={String(value)} onChange={onFieldChange} />
                )}
              </label>
            ))}
            <label className="form-field md:col-span-2">
              <span className="text-sm text-[var(--muted)]">上传封面图片</span>
              <input className="input-base" type="file" accept="image/*" onChange={onUploadImage} />
              {uploading ? <span className="text-sm text-[var(--muted)]">图片上传中...</span> : null}
            </label>
          </div>

          <div className="dashboard-actions mt-5">
            <button className="ghost-button" onClick={validateForm}>先做字段校验</button>
            <button className="action-button" onClick={createAircraft}>创建航空器</button>
            <button className="ghost-button" onClick={updateAircraft}>更新已创建航空器</button>
            <button className="ghost-button" onClick={submitReview}>提交审核</button>
            <button className="ghost-button" onClick={() => approveOrReject("approve")}>审核通过</button>
            <button className="ghost-button" onClick={() => approveOrReject("reject")}>审核驳回</button>
          </div>
        </Panel>

        <Panel title="校验结果" kicker="POST /api/admin/content/validate">
          {validation ? (
            <div className="space-y-4 text-sm text-[var(--muted)]">
              <p>校验通过：{validation.passed ? "是" : "否"}</p>
              <div>
                <p className="mb-2 font-medium text-[var(--text)]">阻塞项</p>
                <ul className="space-y-2">
                  {validation.blockingIssues.length > 0 ? validation.blockingIssues.map((item) => <li key={item}>- {item}</li>) : <li>- 无</li>}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-medium text-[var(--text)]">建议项</p>
                <ul className="space-y-2">
                  {validation.warningIssues.length > 0 ? validation.warningIssues.map((item) => <li key={item}>- {item}</li>) : <li>- 无</li>}
                </ul>
              </div>
            </div>
          ) : (
            <div className="empty-tip">先执行字段校验，再查看阻塞项与建议项。</div>
          )}
        </Panel>
      </div>

      <Panel title="审计日志" kicker="GET /api/admin/audit-logs">
        <div className="overflow-x-auto">
          <table className="panel-table min-w-[900px]">
            <thead>
              <tr>
                <th>时间</th>
                <th>操作人</th>
                <th>动作</th>
                <th>对象</th>
                <th>摘要</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 12).map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.operatorName}</td>
                  <td>{log.action}</td>
                  <td>{log.entityType}</td>
                  <td>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Panel title="已有航空器内容库" kicker="GET /api/admin/aircraft">
          <div className="surface-grid md:grid-cols-2">
            {adminAircraft.map((item) => (
              <article key={item.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <CoverImage
                  src={item.coverImage}
                  alt={item.nameZh}
                  label={item.aircraftType}
                  className="mb-4 aspect-[16/9]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-semibold">{item.nameZh}</h4>
                  <Badge tone={item.status === "published" ? "success" : item.status === "in_review" ? "warning" : "default"}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="code-chip">缺失字段 {item.missingFieldCount}</span>
                  <span className="code-chip">阻塞项 {item.blockingIssueCount}</span>
                  <span className="code-chip">建议项 {item.warningIssueCount}</span>
                </div>
                  <button className="ghost-button mt-4" onClick={() => loadAircraftAsDraft(item)}>
                  载入表单继续编辑
                </button>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="待审核队列" kicker="GET /api/admin/review-queue">
          <div className="surface-grid">
            {reviewQueue.length === 0 ? (
              <div className="empty-tip">当前没有待审核条目。</div>
            ) : (
              reviewQueue.map((item) => (
                <article key={item.workflowId} className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                  <CoverImage
                    src={item.entityCoverImage}
                    alt={item.entityName}
                    label="审核队列"
                    className="mb-4 aspect-[16/10]"
                  />
                  <h4 className="text-base font-semibold">{item.entityName}</h4>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    状态：{item.entityStatus} · 提交时间：{new Date(item.submittedAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="code-chip">{item.workflowId}</span>
                    {item.taskStatus ? <span className="code-chip">{item.taskStatus}</span> : null}
                  </div>
                  <button className="ghost-button mt-4" onClick={() => setWorkflowId(item.workflowId)}>
                    选为当前审核流
                  </button>
                </article>
              ))
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
