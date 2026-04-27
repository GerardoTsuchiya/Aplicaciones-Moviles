import { Todo } from "../todos/types";

export type User = {
    id: number;
    name: string | null;
    email: string;
    createAt: string;
    todos: Todo[];
};

