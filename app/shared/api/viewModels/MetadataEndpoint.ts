export interface MetadataRecordViewModel {
  job_name: string;
  metric_name: string;
  value: number;
  created_at: Date;
  updated_at: Date;
}

export interface MetadataRecordsViewModel {
  success: boolean;
  data: {
    metadataRecords: MetadataRecordViewModel[];
  };
}
