import { Knex } from "knex";
import { expect } from "earl";
import {
  MetadataJobName,
  MetadataMetricName,
  MetadataRecord,
  MetadataRepository,
  TABLE_NAME,
} from "./MetadataRepository";
import { getTestDatabase } from "../getTestDatabase";

describe(MetadataRepository.name, () => {
  let repository: MetadataRepository;
  let knexInstance: Knex;

  beforeEach(async () => {
    knexInstance = await getTestDatabase();
    repository = new MetadataRepository(knexInstance);
  });

  afterEach(async () => {
    await knexInstance.destroy();
  });

  describe(MetadataRepository.prototype.getAll.name, () => {
    it("retrieves all metadata records", async () => {
      const expectedMetadata: MetadataRecord[] = [
        {
          jobName: MetadataJobName.L1FinalityModule,
          metricName: MetadataMetricName.LatestBlockNumber,
          value: 1000,
        },
      ];

      await repository.setMetadata(
        MetadataJobName.L1FinalityModule,
        MetadataMetricName.LatestBlockNumber,
        1000,
      );

      const retrievedMetadata = await repository.getAll();
      expect(retrievedMetadata!).toHaveLength(1);
      retrievedMetadata!.forEach((record) => {
        const matchingExpected = expectedMetadata.find(
          (expected) =>
            expected.jobName === record.jobName &&
            expected.metricName === record.metricName &&
            expected.value === record.value,
        );
      });
    });
  });

  describe(MetadataRepository.prototype.getMetadata.name, () => {
    it("retrieves specific metadata record", async () => {
      const jobName = MetadataJobName.L1FinalityModule;
      const metricName = MetadataMetricName.LatestBlockNumber;
      const expectedMetadata: MetadataRecord = {
        jobName,
        metricName,
        value: 1000,
      };

      await repository.setMetadata(jobName, metricName, 1000);
      const retrievedMetadata = await repository.getMetadata(
        jobName,
        metricName,
      );

      expect(retrievedMetadata?.value).toEqual(expectedMetadata.value);
    });
  });

  describe(MetadataRepository.prototype.setMetadata.name, () => {
    it("upsert a new metadata record", async () => {
      const jobName = MetadataJobName.L1FinalityModule;
      const metricName = MetadataMetricName.LatestBlockNumber;
      const value = 2000;

      await repository.setMetadata(jobName, metricName, value);
      await repository.setMetadata(jobName, metricName, value + 1000);

      const retrievedMetadata = await repository.getMetadata(
        jobName,
        metricName,
      );

      expect(retrievedMetadata?.value).toEqual(value + 1000);
    });
  });
});
