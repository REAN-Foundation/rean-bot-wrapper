export interface IAnswerEvaluator {
    readonly name: string;

    prepare(): Promise<void>;

    score(question: string, expected: string, actual: string): Promise<number>;
}
