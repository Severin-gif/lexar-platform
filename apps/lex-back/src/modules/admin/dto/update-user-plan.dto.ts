import { IsIn, IsString } from 'class-validator';

export const allowedPlans = ['free', 'vip', 'pro'] as const;
export type UserPlan = (typeof allowedPlans)[number];

export class UpdateUserPlanDto {
  @IsString()
  @IsIn(allowedPlans)
  plan!: UserPlan;
}
