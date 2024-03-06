import { MetadataRecord } from '../../../backend/src/database/repositories/MetadataRepository'
import {
  MetadataJobName,
  MetadataMetricName,
} from '../../../backend/src/database/repositories/MetadataRepository'

export function subsetMetadataRecords(
  records: MetadataRecord[],
  jobName: MetadataJobName,
  metricName: MetadataMetricName
): MetadataRecord[] {
  return records.filter(
    (record) => record.jobName === jobName && record.metricName === metricName
  )
}
