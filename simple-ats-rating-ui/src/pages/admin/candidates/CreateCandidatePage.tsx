import React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CandidateForm,
  AvailableCandidateUserPickerDialog,
} from "@/components/admin/candidates"
import { candidateService, sessionService } from "@/services"
import { useToast } from "@/hooks/useToast"
import type { AvailableCandidateUser, CreateCandidateRequest } from "@/types"

type CreateMode = "manual" | "existing"

export function CreateCandidatePage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [selectedSessionId, setSelectedSessionId] = React.useState<string>(
    searchParams.get("sessionId") || "",
  )
  const [createMode, setCreateMode] = React.useState<CreateMode>("manual")
  const [selectedUser, setSelectedUser] = React.useState<AvailableCandidateUser | null>(null)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  const { data: sessionsData } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionService.getSessions({ page: 1, page_size: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateCandidateRequest) =>
      candidateService.createCandidate(selectedSessionId, data),
    onSuccess: () => {
      success("候选人已创建", "创建成功")
      queryClient.invalidateQueries({ queryKey: ["candidates", selectedSessionId] })
      queryClient.invalidateQueries({ queryKey: ["available-candidate-users", selectedSessionId] })
      queryClient.invalidateQueries({ queryKey: ["session", selectedSessionId] })
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      navigate(`/admin/candidates?sessionId=${selectedSessionId}`)
    },
    onError: (err: any) => {
      error(err.message || "创建候选人失败，请重试", "创建失败")
    },
  })

  const handleManualSubmit = (data: CreateCandidateRequest) => {
    if (!selectedSessionId) {
      error("请先选择场次", "提示")
      return
    }
    createMutation.mutate(data)
  }

  const handleCreateFromExisting = () => {
    if (!selectedSessionId) {
      error("请先选择场次", "提示")
      return
    }

    if (!selectedUser?.id) {
      error("请选择候选人", "提示")
      return
    }

    createMutation.mutate({ user_id: selectedUser.id })
  }

  const handleCancel = () => {
    navigate(-1)
  }

  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setSelectedUser(null)
  }

  const handleModeChange = (mode: string) => {
    setCreateMode(mode as CreateMode)
    setSelectedUser(null)
  }

  const sessions = sessionsData?.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">创建候选人</h1>
          <p className="text-muted-foreground">为场次添加新的候选人</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>选择场次</CardTitle>
          <CardDescription>请选择候选人要加入的面试场次</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSessionId} onValueChange={handleSessionChange}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="请选择场次" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.name} - {session.date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSessionId && (
        <Card>
          <CardHeader>
            <CardTitle>创建方式</CardTitle>
            <CardDescription>可手动新建，或从已有 candidate 用户中选择</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={createMode} onValueChange={handleModeChange}>
              <SelectTrigger className="w-full md:w-[320px]">
                <SelectValue placeholder="请选择创建方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">手动新建</SelectItem>
                <SelectItem value="existing">选择已有候选人</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedSessionId && createMode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle>候选人信息</CardTitle>
            <CardDescription>填写候选人的基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <CandidateForm
              onSubmit={handleManualSubmit}
              onCancel={handleCancel}
              isSubmitting={createMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {selectedSessionId && createMode === "existing" && (
        <Card>
          <CardHeader>
            <CardTitle>选择已有候选人</CardTitle>
            <CardDescription>
              仅展示角色为 candidate 且未加入当前场次的用户
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
                选择候选人
              </Button>
              {selectedUser && (
                <Button type="button" variant="ghost" onClick={() => setSelectedUser(null)}>
                  清空已选
                </Button>
              )}
            </div>

            {selectedUser ? (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                已选择: {selectedUser.name} / {selectedUser.phone}
                {selectedUser.email ? ` / ${selectedUser.email}` : ""}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">尚未选择候选人</p>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={createMutation.isPending}
              >
                取消
              </Button>
              <Button
                type="button"
                disabled={createMutation.isPending || !selectedUser}
                onClick={handleCreateFromExisting}
              >
                {createMutation.isPending ? "提交中..." : "创建"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AvailableCandidateUserPickerDialog
        open={pickerOpen}
        sessionId={selectedSessionId}
        initialSelectedUserId={selectedUser?.id}
        onOpenChange={setPickerOpen}
        onConfirm={(user) => setSelectedUser(user)}
      />
    </div>
  )
}

export default CreateCandidatePage
