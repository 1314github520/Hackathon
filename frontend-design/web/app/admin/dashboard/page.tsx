"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
import { EmptyState, LoadingState, Notice } from "@/components/ui/feedback";
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

const formFieldMeta: Array<{
  key: keyof typeof demoAircraftPayload | "description" | "source";
  label: string;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  hint?: string;
}> = [
  { key: "nameZh", label: "中文名称", placeholder: "例如：波音 777X Demo" },
  { key: "aircraftType", label: "机型分类", placeholder: "例如：客机" },
  { key: "summary", label: "一句话简介", type: "textarea", hint: "用于列表卡片和搜索结果的简短说明。" },
  { key: "description", label: "详细介绍", type: "textarea", hint: "建议写清定位、特点和科普解释。" },
  { key: "manufacturer", label: "制造方", placeholder: "例如：波音" },
  { key: "countryOfOrigin", label: "所属国家", placeholder: "例如：美国" },
  { key: "eraLabel", label: "时代标签", placeholder: "例如：现代航空" },
  { key: "firstFlightYear", label: "首飞年份", type: "number" },
  { key: "rangeKm", label: "航程（km）", type: "number" },
  { key: "engineType", label: "发动机类型", placeholder: "例如：涡扇" },
  { key: "source", label: "资料来源", placeholder: "例如：官方资料或可靠来源" },
];

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
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [actionState, setActionState] = useState("");
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

    try {
      setLoadingDashboard(true);
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
    } finally {
      setLoadingDashboard(false);
    }
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
      setActionState("图片上传中");
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
      setActionState("");
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
      setActionState("字段校验中");
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
    } finally {
      setActionState("");
    }
  }

  async function createAircraft() {
    if (!token) {
      setMessage("请先登录管理员后再创建内容。");
      return;
    }

    try {
      setActionState("创建航空器中");
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
    } finally {
      setActionState("");
    }
  }

  async function updateAircraft() {
    if (!token || !createdAircraft) {
      setMessage("请先创建航空器后再验证更新接口。");
      return;
    }

    try {
      setActionState("更新航空器中");
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
    } finally {
      setActionState("");
    }
  }

  async function submitReview() {
    if (!token || !createdAircraft) {
      setMessage("请先完成创建后再提审。");
      return;
    }

    try {
      setActionState("提交审核中");
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
    } finally {
      setActionState("");
    }
  }

  async function approveOrReject(decision: "approve" | "reject") {
    if (!token || !workflowId) {
      setMessage("当前没有可处理的 workflowId。");
      return;
    }

    try {
      setActionState(decision === "approve" ? "审核通过处理中" : "审核驳回处理中");
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
    } finally {
      setActionState("");
    }
  }

  if (!ready) {
    return <AppShell title="后台联调" subtitle="正在恢复管理员登录态..." />;
  }

  if (!session) {
    return (
      <AppShell title="后台联调" subtitle="需要管理员登录后才能调用后台摘要、校验、创建和审核接口。">
        <Panel title="未登录" kicker="管理员鉴权">
          <EmptyState
            title="请先登录管理员账号"
            description="登录后才能访问摘要统计、内容校验、媒体上传和审核队列。"
            actions={
              <Link href="/admin/login" className="action-button">
                去管理员登录
              </Link>
            }
          />
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
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? (
        <Notice
          tone="error"
          actions={
            <button type="button" className="ghost-button" onClick={() => void refreshDashboardData()}>
              重新加载
            </button>
          }
        >
          {error}
        </Notice>
      ) : null}
      {actionState ? <LoadingState label={actionState} description="请稍候，后台操作正在执行。" compact /> : null}
      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="已发布条目" value={String(summary.publishedCount)} />
          <StatCard label="缺失字段数" value={String(summary.missingFieldCount)} tone="warning" />
          <StatCard label="待审核任务" value={String(summary.reviewPendingCount)} />
          <StatCard label="本周修复率" value={summary.weeklyFixRate} tone="success" />
        </div>
      ) : null}
      {loadingDashboard ? <LoadingState label="正在同步后台概览" description="系统正在加载摘要、内容库、审核队列和审计日志。" compact /> : null}

      <div className="two-column">
        <Panel
          title="航空器表单联调"
          kicker="校验 + 创建 + 提审"
          rightSlot={
            <div className="dashboard-actions">
              <button type="button" className="ghost-button" onClick={() => setForm(initialFormState)}>
                恢复演示数据
              </button>
              <button type="button" className="ghost-button" onClick={() => void refreshDashboardData()}>
                刷新后台数据
              </button>
            </div>
          }
        >
          <CoverImage
            src={typeof form.coverImage === "string" ? form.coverImage : ""}
            alt={String(form.nameZh || "航空器封面")}
            label="封面图预览"
            className="mb-4 aspect-[16/8]"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {formFieldMeta.map((field) => (
              <label
                key={field.key}
                className={`form-field ${field.type === "textarea" ? "md:col-span-2" : ""}`}
              >
                <span className="text-sm text-[var(--muted)]">{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea
                    className="input-base min-h-28"
                    name={field.key}
                    value={String(form[field.key] ?? "")}
                    onChange={onFieldChange}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    className="input-base"
                    name={field.key}
                    type={field.type === "number" ? "number" : "text"}
                    value={String(form[field.key] ?? "")}
                    onChange={onFieldChange}
                    placeholder={field.placeholder}
                  />
                )}
                {field.hint ? <span className="field-hint">{field.hint}</span> : null}
              </label>
            ))}
            <label className="form-field md:col-span-2">
              <span className="text-sm text-[var(--muted)]">封面图地址</span>
              <input
                className="input-base"
                name="coverImage"
                value={String(form.coverImage ?? "")}
                onChange={onFieldChange}
                placeholder="/uploads/example.png 或完整图片地址"
              />
              <span className="field-hint">可直接填写图片地址，也可以使用下面的图片上传功能。</span>
            </label>
            <label className="form-field md:col-span-2">
              <span className="text-sm text-[var(--muted)]">上传封面图片</span>
              <input className="input-base" type="file" accept="image/*" onChange={onUploadImage} />
              {uploading ? <span className="text-sm text-[var(--muted)]">图片上传中...</span> : null}
            </label>
          </div>

          <div className="dashboard-actions mt-5">
            <button className="ghost-button" type="button" onClick={validateForm} disabled={!!actionState}>
              先做字段校验
            </button>
            <button className="action-button" type="button" onClick={createAircraft} disabled={!!actionState}>
              创建航空器
            </button>
            <button className="ghost-button" type="button" onClick={updateAircraft} disabled={!createdAircraft || !!actionState}>
              更新已创建航空器
            </button>
            <button className="ghost-button" type="button" onClick={submitReview} disabled={!createdAircraft || !!actionState}>
              提交审核
            </button>
            <button className="ghost-button" type="button" onClick={() => approveOrReject("approve")} disabled={!workflowId || !!actionState}>
              审核通过
            </button>
            <button className="ghost-button" type="button" onClick={() => approveOrReject("reject")} disabled={!workflowId || !!actionState}>
              审核驳回
            </button>
          </div>

          {createdAircraft ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="success">当前草稿：{createdAircraft.nameZh}</Badge>
              <Badge>{createdAircraft.status}</Badge>
            </div>
          ) : null}
        </Panel>

        <Panel title="校验结果" kicker="POST /api/admin/content/validate">
          {validation ? (
            <div className="space-y-4 text-sm text-[var(--muted)]">
              <p>校验通过：{validation.passed ? "是" : "否"}</p>
              <div>
                <p className="mb-2 font-medium text-[var(--text)]">缺失字段</p>
                <div className="flex flex-wrap gap-2">
                  {validation.missingFields.length > 0 ? (
                    validation.missingFields.map((item) => <span key={item} className="code-chip">{item}</span>)
                  ) : (
                    <span className="code-chip">无</span>
                  )}
                </div>
              </div>
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
            <EmptyState
              title="还没有校验结果"
              description="先执行字段校验，再查看缺失字段、阻塞项与建议项。"
            />
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
          {adminAircraft.length === 0 ? (
            <EmptyState title="内容库为空" description="当前还没有后台航空器记录，可先用左侧表单创建一条内容。" />
          ) : (
            <div className="surface-grid md:grid-cols-2">
              {adminAircraft.map((item) => (
                <article key={item.id} className="content-card">
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
                <button className="ghost-button mt-4" type="button" onClick={() => loadAircraftAsDraft(item)}>
                  载入表单继续编辑
                </button>
              </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="待审核队列" kicker="GET /api/admin/review-queue">
          <div className="surface-grid">
            {reviewQueue.length === 0 ? (
              <EmptyState title="当前没有待审核条目" description="提交审核后，新建内容会显示在这里。" />
            ) : (
              reviewQueue.map((item) => (
                <article key={item.workflowId} className="content-card">
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
                  <button className="ghost-button mt-4" type="button" onClick={() => setWorkflowId(item.workflowId)}>
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
