import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Plus, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  CandidateTable,
  CandidateFilters,
  ImportCandidatesDialog,
} from "@/components/admin/candidates"
import { Loading } from "@/components/common/Loading"
import { EmptyState } from "@/components/common/EmptyState"
import { candidateService, sessionService } from "@/services"
import { useToast } from "@/hooks/useToast"
import type { CandidateQueryParams } from "@/types"

export function CandidateListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const [searchParams] = useSearchParams()

  const sessionId = searchParams.get("sessionId") || ""

  const [keyword, setKeyword] = useState("")
  const [gender, setGender] = useState("")
  const [education, setEducation] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null)

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionService.getSessionById(sessionId),
    enabled: !!sessionId,
  })

  const queryParams: CandidateQueryParams = {
    page,
    page_size: pageSize,
    keyword: keyword || undefined,
    status: status || undefined,
  }

  const {
    data: candidatesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["candidates", sessionId, queryParams],
    queryFn: () => candidateService.getCandidates(sessionId, queryParams),
    enabled: !!sessionId,
  })

  const deleteMutation = useMutation({
    mutationFn: candidateService.deleteCandidate,
    onSuccess: () => {
      success("候选人已删除", "删除成功")
      queryClient.invalidateQueries({ queryKey: ["candidates", sessionId] })
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] })
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      setDeleteDialogOpen(false)
      setCandidateToDelete(null)
    },
    onError: () => {
      error("删除候选人失败，请重试", "删除失败")
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (orders: { id: string; order: number }[]) =>
      candidateService.reorderCandidates(sessionId, orders),
    onSuccess: () => {
      success("顺序已更新", "更新成功")
      queryClient.invalidateQueries({ queryKey: ["candidates", sessionId] })
    },
    onError: () => {
      error("更新顺序失败，请重试", "更新失败")
    },
  })

  const handleCreate = () => {
    navigate(`/admin/candidates/create?sessionId=${sessionId}`)
  }

  const handleImport = () => {
    setImportDialogOpen(true)
  }

  const handleImportSuccess = (result: { success: number; failed: number }) => {
    success(`成功导入 ${result.success} 条，失败 ${result.failed} 条`, "导入结果")
    queryClient.invalidateQueries({ queryKey: ["candidates", sessionId] })
    queryClient.invalidateQueries({ queryKey: ["session", sessionId] })
    queryClient.invalidateQueries({ queryKey: ["sessions"] })
    setImportDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setCandidateToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (candidateToDelete) {
      deleteMutation.mutate(candidateToDelete)
    }
  }

  const handleReorder = (orders: { id: string; order: number }[]) => {
    reorderMutation.mutate(orders)
  }

  const updateOrderMutation = useMutation({
    mutationFn: ({ candidateId, order }: { candidateId: string; order: number }) =>
      candidateService.updateCandidateOrder(candidateId, order),
    onSuccess: () => {
      success("面试顺序已更新", "更新成功")
      queryClient.invalidateQueries({ queryKey: ["candidates", sessionId] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      error(msg || "更新面试顺序失败，请重试", "更新失败")
    },
  })

  const handleUpdateOrder = (candidateId: string, order: number) => {
    updateOrderMutation.mutate({ candidateId, order })
  }

  const handleResetFilters = () => {
    setKeyword("")
    setGender("")
    setEducation("")
    setStatus("")
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const candidates = candidatesData?.items || []
  const totalPages = candidatesData?.total_pages || 1

  if (!sessionId) {
    return (
      <EmptyState
        title="缺少场次信息"
        description="请从场次管理页面进入候选人管理"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/sessions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">候选人管理</h1>
            <p className="text-muted-foreground">管理当前场次的候选人，调整面试顺序</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>当前场次</CardTitle>
          <CardDescription>候选人管理已绑定场次，不再手动选择</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionLoading ? (
            <p className="text-sm text-muted-foreground">加载场次信息中...</p>
          ) : session ? (
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">场次名称:</span> {session.name}
              </p>
              <p>
                <span className="text-muted-foreground">岗位:</span> {session.position}
              </p>
              <p>
                <span className="text-muted-foreground">时间:</span>{" "}
                {new Date(session.date).toLocaleString("zh-CN")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-destructive">场次信息加载失败</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>根据条件筛选候选人</CardDescription>
        </CardHeader>
        <CardContent>
          <CandidateFilters
            keyword={keyword}
            gender={gender}
            education={education}
            status={status}
            onKeywordChange={setKeyword}
            onGenderChange={setGender}
            onEducationChange={setEducation}
            onStatusChange={setStatus}
            onReset={handleResetFilters}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <CardTitle>候选人列表</CardTitle>
            <CardDescription>
              共 {candidatesData?.total || 0} 位候选人，拖拽可调整顺序
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              批量导入
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              创建候选人
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : isError ? (
            <EmptyState
              title="加载失败"
              description="无法加载候选人列表，请刷新页面重试"
            />
          ) : candidates.length === 0 ? (
            <EmptyState
              title="暂无候选人"
              description='点击上方按钮创建或导入候选人'
            />
          ) : (
            <>
              <CandidateTable
                candidates={candidates}
                loading={isLoading}
                page={page}
                pageSize={pageSize}
                onReorder={handleReorder}
                onDelete={handleDelete}
                onUpdateOrder={handleUpdateOrder}
              />

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    第 {page} / {totalPages} 页
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ImportCandidatesDialog
        open={importDialogOpen}
        sessionId={sessionId}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这位候选人吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CandidateListPage
