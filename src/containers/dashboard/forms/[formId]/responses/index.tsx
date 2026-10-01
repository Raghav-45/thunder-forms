// TODO: This is VIBE CODED, Refactor this file

import {
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconDotsVertical,
	IconDownload,
	IconLayoutColumns,
} from "@tabler/icons-react";
import { useParams } from "@tanstack/react-router";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { useEffect, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import NoResponsesYetCard from "#/containers/dashboard/forms/[formId]/responses/components/no-responses-yet-card";
import {
	type FormResponse,
	formatResponseValue,
	getQuizResult,
	QuestionGrading,
	ResponseDetailsDrawer,
	responseFields,
} from "#/containers/dashboard/forms/[formId]/responses/components/quiz-grading";
import LoadingScreen from "#/containers/dashboard/forms/components/loading-screen";
import { isFileUploadReceiptList } from "#/features/file-uploads/types";
import type { FieldConfig } from "#/features/form-builder/elements";
import {
	type FormStructure,
	getOrderedFormFields,
	hasQuizAnswerKey,
	isFormStructure,
	isQuizScoredField,
	type QuizSettings,
} from "#/features/form-builder/form-structure";

interface FormResponsesData {
	fields: FormStructure;
	formId: string;
	title: string;
	responses: FormResponse[];
}

function ResponsesDataTable({
	data: responses,
	formId,
	manualQuizFields,
	quizFields,
	onResponseUpdated,
	quizSettings,
}: {
	data: FormResponse[];
	formId: string;
	manualQuizFields: FieldConfig[];
	quizFields: FieldConfig[];
	onResponseUpdated: (response: FormResponse) => void;
	quizSettings: QuizSettings | undefined;
}) {
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const formatFieldName = (fieldName: string) => {
		return fieldName
			.replace(/_\d+$/, "")
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
	};

	const formatFieldValue = (value: unknown) => {
		if (isFileUploadReceiptList(value))
			return value.map((file) => file.name).join(", ");
		if (typeof value === "string" && value.length > 50) {
			return value.substring(0, 50) + "...";
		}
		return formatResponseValue(value);
	};

	// Get all unique field names from responses
	const allFields = React.useMemo(() => {
		const fieldsSet = new Set<string>();
		responses.forEach((response) => {
			responseFields(response.data).forEach(([key]) => fieldsSet.add(key));
		});
		return Array.from(fieldsSet).sort();
	}, [responses]);

	const columns: ColumnDef<FormResponse>[] = React.useMemo(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={
								table.getIsAllPageRowsSelected() ||
								(table.getIsSomePageRowsSelected() && "indeterminate")
							}
							onCheckedChange={(value) =>
								table.toggleAllPageRowsSelected(!!value)
							}
							aria-label="Select all"
						/>
					</div>
				),
				cell: ({ row }) => (
					<div className="flex items-center justify-center">
						<Checkbox
							checked={row.getIsSelected()}
							onCheckedChange={(value) => row.toggleSelected(!!value)}
							aria-label="Select row"
						/>
					</div>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "id",
				header: "Response ID",
				cell: ({ row }) => {
					return (
						<ResponseDetailsDrawer
							response={row.original}
							formId={formId}
							manualQuizFields={manualQuizFields}
							onResponseUpdated={onResponseUpdated}
							quizSettings={quizSettings}
						/>
					);
				},
				enableHiding: false,
			},
			...allFields.slice(0, 3).map((field) => ({
				accessorKey: `data.${field}`,
				header: formatFieldName(field),
				cell: ({
					row,
				}: {
					row: { original: { data: Record<string, unknown> } };
				}) => (
					<div className="max-w-48 truncate">
						{formatFieldValue(row.original.data[field])}
					</div>
				),
			})),
			...(quizSettings?.enabled
				? [
						{
							id: "quizScore",
							header: "Quiz score",
							cell: ({ row }: { row: { original: FormResponse } }) => {
								const quizResult = getQuizResult(row.original.data);
								if (!quizResult) return "—";
								return quizResult.pendingPoints
									? `${quizResult.score} / ${quizResult.maxScore} pending`
									: `${quizResult.score} / ${quizResult.maxScore}`;
							},
						},
					]
				: []),
			{
				accessorKey: "createdAt",
				header: "Submitted",
				cell: ({ row }) => (
					<Badge variant="outline" className="text-muted-foreground px-2">
						{new Date(row.original.createdAt).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})}
					</Badge>
				),
			},
			{
				id: "actions",
				cell: () => (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
								size="icon"
							>
								<IconDotsVertical />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-32">
							<DropdownMenuItem>View Details</DropdownMenuItem>
							<DropdownMenuItem>Export</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		],
		[allFields, formId, manualQuizFields, onResponseUpdated, quizSettings],
	);

	const table = useReactTable({
		data: responses,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id,
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	const downloadCSV = React.useCallback(() => {
		const headers = [
			"Response ID",
			...allFields.map(formatFieldName),
			"Submitted",
		];
		const rows = responses.map((response) => [
			response.id,
			...allFields.map((field) => {
				const value = response.data[field];
				if (value == null) return "";
				const str = formatResponseValue(value);
				// Escape quotes and wrap in quotes if it contains commas, quotes, or newlines
				if (str.includes(",") || str.includes('"') || str.includes("\n")) {
					return `"${str.replace(/"/g, '""')}"`;
				}
				return str;
			}),
			new Date(response.createdAt).toISOString(),
		]);

		const csvContent = [
			headers.map((h) => (h.includes(",") ? `"${h}"` : h)).join(","),
			...rows.map((row) => row.join(",")),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `form-responses-${new Date().toISOString().slice(0, 10)}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}, [responses, allFields]);

	const totalResponses = responses.length;
	const recentResponses = responses.filter((response) => {
		const responseDate = new Date(response.createdAt);
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		return responseDate >= sevenDaysAgo;
	}).length;

	return (
		<Tabs defaultValue="all" className="w-full flex-col justify-start gap-6">
			<div className="flex items-center justify-between px-4 lg:px-6">
				<TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
					<TabsTrigger value="all">
						All <Badge variant="secondary">{totalResponses}</Badge>
					</TabsTrigger>
					<TabsTrigger value="recent">
						Recent <Badge variant="secondary">{recentResponses}</Badge>
					</TabsTrigger>
					{quizFields.length ? (
						<TabsTrigger value="question">By question</TabsTrigger>
					) : null}
				</TabsList>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={downloadCSV}>
						<IconDownload />
						<span className="hidden lg:inline">Download CSV</span>
						<span className="lg:hidden">CSV</span>
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<IconLayoutColumns />
								<span className="hidden lg:inline">Customize Columns</span>
								<span className="lg:hidden">Columns</span>
								<IconChevronDown />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{table
								.getAllColumns()
								.filter(
									(column) =>
										typeof column.accessorFn !== "undefined" &&
										column.getCanHide(),
								)
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<TabsContent
				value="all"
				className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
			>
				<div className="overflow-hidden rounded-lg border">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id} colSpan={header.colSpan}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										<NoResponsesYetCard />
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label htmlFor="rows-per-page" className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger size="sm" className="w-20" id="rows-per-page">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to first page</span>
								<IconChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<span className="sr-only">Go to previous page</span>
								<IconChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to next page</span>
								<IconChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<span className="sr-only">Go to last page</span>
								<IconChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			</TabsContent>

			<TabsContent
				value="recent"
				className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
			>
				<div className="overflow-hidden rounded-lg border">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id} colSpan={header.colSpan}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{responses
								.filter((response) => {
									const responseDate = new Date(response.createdAt);
									const sevenDaysAgo = new Date();
									sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
									return responseDate >= sevenDaysAgo;
								})
								.slice(
									table.getState().pagination.pageIndex *
										table.getState().pagination.pageSize,
									(table.getState().pagination.pageIndex + 1) *
										table.getState().pagination.pageSize,
								)
								.map((response) => (
									<TableRow key={response.id}>
										<TableCell className="text-center">
											<Checkbox />
										</TableCell>
										<TableCell>
											<ResponseDetailsDrawer
												response={response}
												formId={formId}
												manualQuizFields={manualQuizFields}
												onResponseUpdated={onResponseUpdated}
												quizSettings={quizSettings}
											/>
										</TableCell>
										{allFields.slice(0, 3).map((field) => (
											<TableCell key={field} className="max-w-48 truncate">
												{formatFieldValue(response.data[field])}
											</TableCell>
										))}
										<TableCell>
											<Badge
												variant="outline"
												className="text-muted-foreground px-2"
											>
												{new Date(response.createdAt).toLocaleDateString(
													"en-US",
													{
														month: "short",
														day: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													},
												)}
											</Badge>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-8"
													>
														<IconDotsVertical />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent>
													<DropdownMenuItem>View Details</DropdownMenuItem>
													<DropdownMenuItem>Export</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem variant="destructive">
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</div>
			</TabsContent>
			{quizFields.length ? (
				<TabsContent value="question" className="relative overflow-auto">
					<QuestionGrading
						responses={responses}
						formId={formId}
						quizFields={quizFields}
						onResponseUpdated={onResponseUpdated}
					/>
				</TabsContent>
			) : null}
		</Tabs>
	);
}

export default function FormResponsesPage() {
	const { formId } = useParams({ strict: false }) as { formId?: string };
	const [formData, setFormData] = useState<FormResponsesData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchFormResponses = async () => {
			if (!formId) return;

			try {
				setIsLoading(true);
				const response = await fetch(`/api/forms/${formId}/responses`);

				if (!response.ok) {
					throw new Error("Failed to fetch form responses");
				}

				const data: FormResponsesData = await response.json();
				setFormData(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setIsLoading(false);
			}
		};

		fetchFormResponses();
	}, [formId]);

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-96">
				<Card>
					<CardContent className="pt-6">
						<p className="text-red-500">Error: {error}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!formData) {
		return (
			<div className="flex items-center justify-center h-96">
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground">No form data found</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const quizStructure = isFormStructure(formData.fields)
		? formData.fields
		: null;
	const quizFields = quizStructure
		? getOrderedFormFields(quizStructure).filter((field) =>
				isQuizScoredField(field, quizStructure.quiz),
			)
		: [];
	const manualQuizFields = quizFields.filter(
		(field) => !hasQuizAnswerKey(field),
	);

	return (
		<ResponsesDataTable
			data={formData.responses}
			formId={formData.formId}
			manualQuizFields={manualQuizFields}
			quizFields={quizFields}
			quizSettings={quizStructure?.quiz}
			onResponseUpdated={(response) =>
				setFormData((current) =>
					current
						? {
								...current,
								responses: current.responses.map((item) =>
									item.id === response.id ? response : item,
								),
							}
						: current,
				)
			}
		/>
	);
}
