import { v4 as uuidv4 } from 'uuid';

export interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITodoRepository {
    create(todo: Todo): Promise<Todo>;
    findById(id: string): Promise<Todo | null>;
    findAll(): Promise<Todo[]>;
    update(todo: Todo): Promise<void>;
    delete(id: string): Promise<void>;
}

export interface ITodoService {
    addTodo(title: string, description?: string): Promise<Todo>;
    getTodoById(id: string): Promise<Todo>;
    listTodos(): Promise<Todo[]>;
    markAsCompleted(id: string): Promise<void>;
    removeTodo(id: string): Promise<void>;
}

export interface ITodoController {
    createTodo(request: CreateTodoRequest): Promise<Todo>;
    getTodo(request: GetTodoRequest): Promise<Todo>;
    listTodos(): Promise<Todo[]>;
    completeTodo(request: CompleteTodoRequest): Promise<void>;
    deleteTodo(request: DeleteTodoRequest): Promise<void>;
}

export interface CreateTodoRequest {
    title: string;
    description?: string;
}

export interface GetTodoRequest {
    id: string;
}

export interface CompleteTodoRequest {
    id: string;
}

export interface DeleteTodoRequest {
    id: string;
}


export class InMemoryTodoRepository implements ITodoRepository {
    private todos: Map<string, Todo> = new Map();

    async create(todo: Todo): Promise<Todo> {
        return this.todos.set(todo.id, todo);
    }

    async findById(id: string): Promise<Todo | null> {
        return this.todos.get(id) ?? null;
    }

    async findAll(): Promise<Todo[]> {
        return Array.from(this.todos.values());
    }

    async update(todo: Todo): Promise<void> {
        if (this.todos.has(todo.id)) {
            this.todos.set(todo.id, todo);
        }
    }

    async delete(id: string): Promise<void> {
        this.todos.delete(id);
    }
}


export class TodoService implements ITodoService {
    private todoRepository: ITodoRepository;

    constructor(todoRepository: ITodoRepository) {
        this.todoRepository = todoRepository;
    }


    async addTodo(title: string, description?: string): Promise<Todo> {
        const now = new Date();
        const todo: Todo = {
            id: uuidv4(),
            title,
            description,
            completed: false,
            createdAt: now,
            updatedAt: now,
        };
        await this.todoRepository.create(todo);
        return todo;
    }

    async getTodoById(id: string): Promise<Todo> {
        const todo = await this.todoRepository.findById(id);
        if (!todo) {
            throw new Error('Todo not found');
        }
        return todo;
    }

    async listTodos(): Promise<Todo[]> {
        return await this.todoRepository.findAll();
    }

    async markAsCompleted(id: string): Promise<void> {
        const todo = await this.getTodoById(id);
        todo.completed = true;
        todo.updatedAt = new Date();
        await this.todoRepository.update(todo);
    }

    async removeTodo(id: string): Promise<void> {
        await this.todoRepository.delete(id);
    }
}

export class TodoController implements ITodoController {

    private todoService: ITodoService;

    constructor(todoService: ITodoService) {
        this.todoService = todoService;
    }

    async createTodo(request: CreateTodoRequest): Promise<Todo> {
        return await this.todoService.addTodo(request.title, request.description);
    }

    async getTodo(request: GetTodoRequest): Promise<Todo> {
        return await this.todoService.getTodoById(request.id);
    }

    async listTodos(): Promise<Todo[]> {
        return await this.todoService.listTodos();
    }

    async completeTodo(request: CompleteTodoRequest): Promise<void> {
        await this.todoService.markAsCompleted(request.id);
    }

    async deleteTodo(request: DeleteTodoRequest): Promise<void> {
        await this.todoService.removeTodo(request.id);
    }
}

async function main() {
    const todoRepository: ITodoRepository = new InMemoryTodoRepository();
    const todoService: ITodoService = new TodoService(todoRepository);
    const todoController: ITodoController = new TodoController(todoService);

    try {
        console.log('--- Creating Todos ---');
        const todo1 = await todoController.createTodo({
            title: 'Buy groceries',
            description: 'Milk, Bread, Eggs',
        });
        console.log('Created Todo:', todo1);

        const todo2 = await todoController.createTodo({
            title: 'Clean the house',
        });

        console.log('Created Todo:', todo2);

        console.log('\n--- Listing All Todos ---');
        let todos = await todoController.listTodos();
        console.log(todos);

        console.log('\n--- Getting Todo by ID ---');
        const fetchedTodo = await todoController.getTodo({ id: todo1.id });
        console.log(fetchedTodo);

        console.log('\n--- Marking Todo as Completed ---');
        await todoController.completeTodo({ id: todo1.id });
        const completedTodo = await todoController.getTodo({ id: todo1.id });
        console.log(completedTodo);

        console.log('\n--- Deleting a Todo ---');
        await todoController.deleteTodo({ id: todo2.id });
        todos = await todoController.listTodos();
        console.log(todos);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();

