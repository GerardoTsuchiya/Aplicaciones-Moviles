import { User } from '../user/types';

export type Todo = {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    user: User[];
};