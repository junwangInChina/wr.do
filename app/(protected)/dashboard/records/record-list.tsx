"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "@prisma/client";
import {
  ArrowUpRight,
  DotSquareIcon,
  PenLine,
  RefreshCwIcon,
} from "lucide-react";
import useSWR, { useSWRConfig } from "swr";

import { TTL_ENUMS } from "@/lib/cloudflare";
import { UserRecordFormData } from "@/lib/dto/cloudflare-dns-record";
import { fetcher } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StatusDot from "@/components/dashboard/status-dot";
import { FormType, RecordForm } from "@/components/forms/record-form";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";

export interface RecordListProps {
  user: Pick<User, "id" | "name">;
}

function TableColumnSekleton({ className }: { className?: string }) {
  return (
    <TableRow className="grid grid-cols-3 items-center sm:grid-cols-7">
      <TableCell className="col-span-1">
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="col-span-1">
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="col-span-2 hidden sm:inline-block">
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="col-span-1 hidden sm:inline-block">
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="col-span-1 hidden justify-center sm:flex">
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="col-span-1 flex justify-center">
        <Skeleton className="h-5 w-16" />
      </TableCell>
    </TableRow>
  );
}

export default function UserRecordsList({ user }: RecordListProps) {
  const [isShowForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<FormType>("add");
  const [currentEditRecord, setCurrentEditRecord] =
    useState<UserRecordFormData | null>(null);

  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR<UserRecordFormData[]>(
    "/api/record",
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const handleRefresh = () => {
    mutate("/api/record", undefined);
  };

  return (
    <>
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Records</CardTitle>
            <CardDescription className="text-balance">
              All DNS Records
            </CardDescription>
          </div>
          <div className="ml-auto flex items-center justify-end gap-3">
            <Button
              variant={"outline"}
              onClick={() => handleRefresh()}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCwIcon className="size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-4" />
              )}
            </Button>
            <Button
              className="w-[120px] shrink-0 gap-1"
              variant="default"
              onClick={() => {
                setCurrentEditRecord(null);
                setShowForm(false);
                setFormType("add");
                setShowForm(!isShowForm);
              }}
            >
              Add record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isShowForm && (
            <RecordForm
              user={{ id: user.id, name: user.name || "" }}
              isShowForm={isShowForm}
              setShowForm={setShowForm}
              type={formType}
              initData={currentEditRecord}
              onRefresh={handleRefresh}
            />
          )}
          <Table>
            <TableHeader>
              <TableRow className="grid grid-cols-3 items-center sm:grid-cols-7">
                <TableHead className="col-span-1 flex items-center font-bold">
                  Type
                </TableHead>
                <TableHead className="col-span-1 flex items-center font-bold">
                  Name
                </TableHead>
                <TableHead className="col-span-2 hidden items-center font-bold sm:flex">
                  Content
                </TableHead>
                <TableHead className="col-span-1 hidden items-center font-bold sm:flex">
                  TTL
                </TableHead>
                <TableHead className="col-span-1 hidden items-center justify-center font-bold sm:flex">
                  Status
                </TableHead>
                <TableHead className="col-span-1 flex items-center justify-center font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  <TableColumnSekleton />
                  <TableColumnSekleton />
                  <TableColumnSekleton />
                </>
              ) : data && data.length > 0 ? (
                data.map((record) => (
                  <TableRow className="grid animate-fade-in grid-cols-3 items-center animate-in sm:grid-cols-7">
                    <TableCell className="col-span-1">
                      <Badge className="text-xs" variant="outline">
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="col-span-1">
                      {record.name.endsWith(".wr.do")
                        ? record.name.slice(0, -6)
                        : record.name}
                    </TableCell>
                    <TableCell className="col-span-2 hidden truncate text-nowrap sm:inline-block">
                      <TooltipProvider>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger>{record.content}</TooltipTrigger>
                          <TooltipContent>{record.content}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="col-span-1 hidden sm:inline-block">
                      {
                        TTL_ENUMS.find((ttl) => ttl.value === `${record.ttl}`)
                          ?.label
                      }
                    </TableCell>
                    <TableCell className="col-span-1 hidden justify-center sm:flex">
                      <StatusDot status={record.active} />
                    </TableCell>
                    <TableCell className="col-span-1 flex justify-center">
                      <Button
                        className="text-sm hover:bg-slate-100"
                        size="sm"
                        variant={"outline"}
                        onClick={() => {
                          setCurrentEditRecord(record);
                          setShowForm(false);
                          setFormType("edit");
                          setShowForm(!isShowForm);
                        }}
                      >
                        <p>Edit</p>
                        <PenLine className="ml-1 size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyPlaceholder>
                  {/* <EmptyPlaceholder.Icon name="globeLock" /> */}
                  <EmptyPlaceholder.Title>No records</EmptyPlaceholder.Title>
                  <EmptyPlaceholder.Description>
                    You don&apos;t have any record yet. Start creating record.
                  </EmptyPlaceholder.Description>
                  <Button
                    className="w-[120px] shrink-0 gap-1"
                    variant="default"
                    onClick={() => {
                      setCurrentEditRecord(null);
                      setShowForm(false);
                      setFormType("add");
                      setShowForm(!isShowForm);
                    }}
                  >
                    Add record
                  </Button>
                </EmptyPlaceholder>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
