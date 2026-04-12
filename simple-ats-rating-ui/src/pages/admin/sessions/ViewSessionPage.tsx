import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionStatusBadge, QRCodeDisplay, InterviewerAssignment } from "@/components/admin/sessions"
import { Loading } from "@/components/common/Loading"
import { EmptyState } from "@/components/common/EmptyState"
import { sessionService } from "@/services"
import { SessionStatus } from "@/types"

export function ViewSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ["session", id],
    queryFn: () => sessionService.getSessionById(id!),
    enabled: !!id,
  })

  const { data: interviewersData, isLoading: isLoadingInterviewers } = useQuery({
    queryKey: ["session-interviewers", id],
    queryFn: () => sessionService.getSessionInterviewers(id!),
    enabled: !!id,
  })

  const qrCodeData = session?.qr_code_url
    ? {
        qr_code_url: session.qr_code_url,
        qr_code_token: "",
        expires_at: session.qr_code_expires_at || new Date().toISOString(),
      }
    : undefined

  if (isLoadingSession) {
    return <Loading />
  }

  if (!session) {
    return (
      <EmptyState
        title="场次不存在"
        description="未找到该场次，请返回场次列表重试"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/admin/sessions")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>
        {session.status === SessionStatus.DRAFT && (
          <Button onClick={() => navigate(`/admin/sessions/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            编辑场次
          </Button>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{session.name}</h1>
          <SessionStatusBadge status={session.status} />
        </div>
        <p className="mt-2 text-muted-foreground">{session.description || "暂无描述"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm font-medium text-muted-foreground">岗位</div>
            <div className="mt-1">{session.position}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">面试时间</div>
            <div className="mt-1">
              {new Date(session.date).toLocaleString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">面试官数量</div>
            <div className="mt-1">{session.statistics?.total_interviewers || 0} 人</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">候选人数量</div>
            <div className="mt-1">{session.statistics?.total_candidates || 0} 人</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">匿名评分</div>
            <div className="mt-1">{session.settings?.anonymous_mode ? "开启" : "关闭"}</div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="interviewers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interviewers">面试官</TabsTrigger>
          <TabsTrigger value="qrcode">二维码</TabsTrigger>
          <TabsTrigger value="candidates">候选人</TabsTrigger>
        </TabsList>

        <TabsContent value="interviewers" className="space-y-4">
          <InterviewerAssignment
            sessionId={id!}
            interviewers={interviewersData?.interviewers || []}
            isLoading={isLoadingInterviewers}
          />
        </TabsContent>

        <TabsContent value="qrcode" className="space-y-4">
          <QRCodeDisplay qrCodeData={qrCodeData} />
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>候选人列表</CardTitle>
                <CardDescription>在当前场次中管理候选人</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/candidates?sessionId=${id}`)}
              >
                候选人管理
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="请前往候选人管理页"
                description="已将候选人管理并入场次管理操作，可点击上方按钮进入"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ViewSessionPage
