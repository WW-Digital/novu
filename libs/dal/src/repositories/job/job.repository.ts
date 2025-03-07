import { ProjectionType } from 'mongoose';
import { ChannelTypeEnum, StepTypeEnum } from '@novu/shared';

import { BaseRepository } from '../base-repository';
import { JobEntity, JobDBModel, JobStatusEnum } from './job.entity';
import { Job } from './job.schema';
import { NotificationTemplateEntity } from '../notification-template';
import { SubscriberEntity } from '../subscriber';
import { NotificationEntity } from '../notification';
import { EnvironmentEntity } from '../environment';
import type { EnforceEnvOrOrgIds } from '../../types/enforce';

type JobEntityPopulated = JobEntity & {
  template: NotificationTemplateEntity;
  notification: NotificationEntity;
  subscriber: SubscriberEntity;
  environment: EnvironmentEntity;
};

export class JobRepository extends BaseRepository<JobDBModel, JobEntity, EnforceEnvOrOrgIds> {
  constructor() {
    super(Job, JobEntity);
  }

  public async storeJobs(jobs: Omit<JobEntity, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<JobEntity[]> {
    const stored: JobEntity[] = [];
    for (let index = 0; index < jobs.length; index++) {
      if (index > 0) {
        jobs[index]._parentId = stored[index - 1]._id;
      }

      const created = await this.create(jobs[index]);
      stored.push(created);
    }

    return stored;
  }

  public async updateStatus(
    organizationId: string,
    jobId: string,
    status: JobStatusEnum
  ): Promise<{ matched: number; modified: number }> {
    return await this.update(
      {
        _organizationId: organizationId,
        _id: jobId,
      },
      {
        $set: {
          status,
        },
      }
    );
  }

  public async setError(organizationId: string, jobId: string, error: Error) {
    await this.update(
      {
        _organizationId: organizationId,
        _id: jobId,
      },
      {
        $set: {
          error,
        },
      }
    );
  }

  public async findInAppsForDigest(organizationId: string, transactionId: string, subscriberId: string) {
    return await this.find({
      _organizationId: organizationId,
      type: ChannelTypeEnum.IN_APP,
      _subscriberId: subscriberId,
      transactionId,
    });
  }

  public async findJobsToDigest(from: Date, templateId: string, environmentId: string, subscriberId: string) {
    /**
     * Remove digest jobs that have been completed and currently delayed jobs that have a digest pending.
     */
    const digests = await this.find({
      updatedAt: {
        $gte: from,
      },
      _templateId: templateId,
      $or: [
        { status: JobStatusEnum.COMPLETED, type: StepTypeEnum.DIGEST },
        { status: JobStatusEnum.DELAYED, type: StepTypeEnum.DELAY },
      ],
      _environmentId: environmentId,
      _subscriberId: subscriberId,
    });
    const transactionIds = digests.map((job) => job.transactionId);

    const result = await this.find({
      updatedAt: {
        $gte: from,
      },
      _templateId: templateId,
      status: JobStatusEnum.COMPLETED,
      type: StepTypeEnum.TRIGGER,
      _environmentId: environmentId,
      _subscriberId: subscriberId,
      transactionId: {
        $nin: transactionIds,
      },
    });

    const transactionIdsTriggers = result.map((job) => job.transactionId);

    /**
     * Update events that have been digested (events that have been sent) to be of status completed.
     * To avoid cases of same events being sent multiple times.
     * Happens in cases of delay followed by digest
     */
    await this.update(
      {
        updatedAt: {
          $gte: from,
        },
        _templateId: templateId,
        status: JobStatusEnum.PENDING,
        type: StepTypeEnum.DIGEST,
        _environmentId: environmentId,
        _subscriberId: subscriberId,
        transactionId: {
          $in: transactionIdsTriggers,
        },
      },
      {
        $set: {
          status: JobStatusEnum.COMPLETED,
        },
      }
    );

    return result;
  }

  public async findOnePopulate({
    query,
    select = '',
    selectTemplate = '',
    selectNotification = '',
    selectSubscriber = '',
    selectEnvironment = '',
  }: {
    query: { _environmentId: string; transactionId: string };
    select?: ProjectionType<JobEntity>;
    selectTemplate?: ProjectionType<NotificationTemplateEntity>;
    selectNotification?: ProjectionType<NotificationEntity>;
    selectSubscriber?: ProjectionType<SubscriberEntity>;
    selectEnvironment?: ProjectionType<EnvironmentEntity>;
  }) {
    const job = this.MongooseModel.findOne(query, select)
      .populate('template', selectTemplate)
      .populate('notification', selectNotification)
      .populate('subscriber', selectSubscriber)
      .populate('environment', selectEnvironment)
      .lean()
      .exec();

    return job as unknown as JobEntityPopulated;
  }

  public async shouldDelayDigestJobOrMerge(
    job: JobEntity,
    digestKey?: string,
    digestValue?: string | number
  ): Promise<{ matched: number; modified: number }> {
    const execution = {
      matched: 0,
      modified: 0,
    };

    const delayedDigestJobs = await this._model.find({
      status: JobStatusEnum.DELAYED,
      type: StepTypeEnum.DIGEST,
      _templateId: job._templateId,
      _environmentId: this.convertStringToObjectId(job._environmentId),
      _subscriberId: this.convertStringToObjectId(job._subscriberId),
      ...(digestKey && { [`payload.${digestKey}`]: digestValue }),
    });

    const matched = delayedDigestJobs.length;
    execution.matched = matched;

    if (execution.matched === 0) {
      const updatedDigestJob = await this._model.updateOne(
        {
          _environmentId: job._environmentId,
          _templateId: job._templateId,
          _subscriberId: job._subscriberId,
          _id: job._id,
        },
        {
          $set: {
            status: JobStatusEnum.DELAYED,
          },
        }
      );

      execution.modified = updatedDigestJob.modifiedCount;
    }

    return execution;
  }
}
