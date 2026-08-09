/**
 * The reintroduction tracker — one food at a time, a few days each, and
 * pausing is always an acceptable answer. Mirrors the `reintroductions` and
 * `reintroduction_checks` tables.
 */

export type ReintroductionStatus = 'queued' | 'testing' | 'passed' | 'reacted' | 'paused';

export type ReintroductionRecord = {
  /** Client-generated UUID; stable across offline retries. */
  id: string;
  /** Optional link into the food catalogue. */
  foodSlug: string | null;
  nameEn: string;
  nameAr: string;
  /** Foods are reintroduced in stages; stage 1 first, one food at a time. */
  stage: number;
  status: ReintroductionStatus;
  trialDays: number;
  startedOn: string | null;
  finishedOn: string | null;
  position: number;
};

export type ReintroductionCheckRecord = {
  id: string;
  reintroductionId: string;
  /** 1-based day within the trial. */
  dayIndex: number;
  checkedOn: string;
  feltFine: boolean;
};

export type ReintroductionState = {
  items: ReintroductionRecord[];
  checks: ReintroductionCheckRecord[];
};

/** The fields a trial's progress can change. */
export type ReintroductionPatch = Partial<
  Pick<ReintroductionRecord, 'status' | 'startedOn' | 'finishedOn'>
>;

export interface ReintroductionRepository {
  load(userId: string): Promise<ReintroductionState>;
  /** First-run setup. Idempotent: a user who already has items is untouched. */
  seed(userId: string, items: ReintroductionRecord[]): Promise<void>;
  update(userId: string, id: string, patch: ReintroductionPatch): Promise<void>;
  addCheck(userId: string, check: ReintroductionCheckRecord): Promise<void>;
  flush?(userId: string): Promise<void>;
}
