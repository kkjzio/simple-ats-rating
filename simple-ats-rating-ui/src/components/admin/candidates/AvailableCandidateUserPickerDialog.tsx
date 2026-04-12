import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { candidateService } from "@/services"
import type { AvailableCandidateUser } from "@/types"

interface AvailableCandidateUserPickerDialogProps {
  open: boolean
  sessionId: string
  initialSelectedUserId?: string
  onOpenChange: (open: boolean) => void
  onConfirm: (user: AvailableCandidateUser) => void
}

const PAGE_SIZE = 10

export function AvailableCandidateUserPickerDialog({
  open,
  sessionId,
  initialSelectedUserId,
  onOpenChange,
  onConfirm,
}: AvailableCandidateUserPickerDialogProps) {
  const [keywordInput, setKeywordInput] = useState("")
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState(initialSelectedUserId ?? "")
  const [selectedUserSnapshot, setSelectedUserSnapshot] = useState<AvailableCandidateUser | null>(null)

  useEffect(() => {
    if (!open) return
    setPage(1)
    setKeyword("")
    setKeywordInput("")
    setSelectedUserId(initialSelectedUserId ?? "")
    setSelectedUserSnapshot(null)
  }, [open, initialSelectedUserId])

  const { data, isLoading, isError } = useQuery({
    queryKey: ["available-candidate-users", sessionId, page, keyword, PAGE_SIZE],
    queryFn: () =>
      candidateService.getAvailableCandidateUsers(sessionId, {
        page,
        page_size: PAGE_SIZE,
        keyword: keyword || undefined,
      }),
    enabled: open && !!sessionId,
  })

  const users = data?.items ?? []
  const totalPages = data?.total_pages ?? 1
  const selectedUser = useMemo(
    () => users.find((item) => item.id === selectedUserId),
    [users, selectedUserId],
  )

  const handleSearch = () => {
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const handleConfirm = () => {
    const userToConfirm = selectedUser || selectedUserSnapshot
    if (!userToConfirm) {
      return
    }
    onConfirm(userToConfirm)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>选择候选人</DialogTitle>
          <DialogDescription>支持按姓名/手机号/邮箱筛选，支持分页浏览</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入姓名、手机号或邮箱"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              筛选
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">选择</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>邮箱</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      暂无可选候选人
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedUserId(user.id)
                        setSelectedUserSnapshot(user)
                      }}
                    >
                      <TableCell>
                        <input
                          type="radio"
                          checked={selectedUserId === user.id}
                          onChange={() => {
                            setSelectedUserId(user.id)
                            setSelectedUserSnapshot(user)
                          }}
                          aria-label={`选择${user.name}`}
                        />
                      </TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              第 {data?.page || 1} / {totalPages} 页，共 {data?.total || 0} 条
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={(data?.page || 1) <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={(data?.page || 1) >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                下一页
              </Button>
            </div>
          </div>
          {isError && (
            <p className="text-sm text-destructive">候选人加载失败，请重试筛选或稍后再试</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            disabled={isLoading || (!selectedUser && !selectedUserSnapshot)}
            onClick={handleConfirm}
          >
            确认选择
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AvailableCandidateUserPickerDialog
