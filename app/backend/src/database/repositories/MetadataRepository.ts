import { Knex } from "knex";

export const TABLE_NAME = "metadata";

export enum MetadataJobName {
  L1FinalityModule = "l1_logs_head",
}

export enum MetadataMetricName {
  LatestBlockNumber = "block_number",
}

export interface MetadataRecord {
  jobName: MetadataJobName;
  metricName: MetadataMetricName;
  value: number;
}

export class MetadataRepository {
  private readonly knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async getAll(): Promise<MetadataRecord[] | null> {
    const result = await this.knex(TABLE_NAME).select<MetadataRecord[]>();
    return result;
  }

  async getMetadata(
    jobName: MetadataJobName,
    metricName: MetadataMetricName,
  ): Promise<MetadataRecord | null> {
    const result = await this.knex(TABLE_NAME)
      .select()
      .where("job_name", jobName.valueOf())
      .where("metric_name", metricName.valueOf())
      .first();
    return result ? result : null;
  }

  async setMetadata(
    jobName: MetadataJobName,
    metricName: MetadataMetricName,
    value: number,
  ) {
    const data = {
      job_name: jobName.valueOf(),
      metric_name: metricName.valueOf(),
      value,
      updated_at: new Date(),
    };

    await this.knex(TABLE_NAME)
      .insert(data)
      .onConflict(["job_name", "metric_name"])
      .merge();
  }
}

export default MetadataRepository;
