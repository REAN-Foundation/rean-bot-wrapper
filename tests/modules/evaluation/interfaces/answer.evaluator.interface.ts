export interface IAnswerEvaluator {
    readonly name: string;

    prepare(): Promise<void>;

    score(expected: string, actual: string): Promise<number>;
}
