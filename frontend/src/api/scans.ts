import apiClient from "./client"
import type { Scan, Finding, CorrelationGroup, Report, ScanCreate } from "../types/index"

export const createScan = async (data: ScanCreate): Promise<Scan> => {
  const response = await apiClient.post<Scan>("/scans/", data)
  return response.data
}

export const getScans = async (): Promise<Scan[]> => {
  const response = await apiClient.get<Scan[]>("/scans/")
  return response.data
}

export const getScan = async (scanId: string): Promise<Scan> => {
  const response = await apiClient.get<Scan>(`/scans/${scanId}`)
  return response.data
}

export const getFindings = async (scanId: string): Promise<Finding[]> => {
  const response = await apiClient.get<Finding[]>(`/scans/${scanId}/findings`)
  return response.data
}

export const getCorrelations = async (
  scanId: string
): Promise<CorrelationGroup[]> => {
  const response = await apiClient.get<CorrelationGroup[]>(
    `/scans/${scanId}/correlations`
  )
  return response.data
}

export const getReport = async (scanId: string): Promise<Report> => {
  const response = await apiClient.get<Report>(`/scans/${scanId}/report`)
  return response.data
}
