'use strict';

const bcryptjs = require('bcryptjs');
const Context = require('./context');

class Database {
    constructor(seedData, enableLogging){
        this.users = seedData.users;
        this.tasks = seedData.tasks;
        this.enableLogging = enableLogging;
        this.context = new Context('tasks-api.db', enableLogging);
    }

    log(message) {
        if (this.enableLogging) {
            console.info(message);
        }
    }

    tableExists(tableName) {
        this.log(`Checking if the ${tableName} table exists...`);

        return this.context
            .retrieveValue(`
                SELECT EXISTS (
                SELECT 1 
                FROM sqlite_master 
                WHERE type = 'table' AND name = ?
                );
            `, tableName);
    }

    createUser(user) {
        return this.context
            .execute(`
                INSERT INTO Users
                (firstName, lastName, emailAddress, password, createdAt, updatedAt)
                VALUES
                (?, ?, ?, ?, datetime('now'), datetime('now'));
            `,
            user.firstName,
            user.lastName,
            user.emailAddress,
            user.password);
    }

    createTask(task) {
        return this.context
            .execute(`
                INSERT INTO Tasks
                (userId, title, description, createdAt, updatedAt)
                VALUES
                (?, ?, ?, datetime('now'), datetime('now'));
            `,
            task.userId,
            task.title,
            task.description);
    }

    async hashUserPasswords(users) {
        const usersWithHashedPasswords = [];
        for (const user of users) {
            const hashedPassword = await bcryptjs.hash(user.password, 10);
            usersWithHashedPasswords.push({ ...user, password: hashedPassword });
        }

        return usersWithHashedPasswords;
    }

    async createUsers(users) {
        for (const user of users) {
        await this.createUser(user);
        }
    }
  
    async createTasks(tasks) {
        for (const task of tasks) {
        await this.createTask(task);
        }
    }

    async init() {
        const userTableExists = await this.tableExists('Users');

        if (userTableExists) {
        this.log('Dropping the Users table...');

        await this.context.execute(`
            DROP TABLE IF EXISTS Users;
        `);
        }

        this.log('Creating the Users table...');

        await this.context.execute(`
            CREATE TABLE Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                firstName VARCHAR(255) NOT NULL DEFAULT '', 
                lastName VARCHAR(255) NOT NULL DEFAULT '', 
                emailAddress VARCHAR(255) NOT NULL DEFAULT '' UNIQUE, 
                password VARCHAR(255) NOT NULL DEFAULT '', 
                createdAt DATETIME NOT NULL, 
                updatedAt DATETIME NOT NULL
            );
        `);

        this.log('Hashing the user passwords...');

        const users = await this.hashUserPasswords(this.users);

        this.log('Creating the user records...');

        await this.createUsers(users);

        const taskTableExists = await this.tableExists('Tasks');

        if (taskTableExists) {
        this.log('Dropping the Tasks table...');

        await this.context.execute(`
            DROP TABLE IF EXISTS Tasks;
        `);
        }

        this.log('Creating the Tasks table...');

        await this.context.execute(`
            CREATE TABLE Tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                title VARCHAR(255) NOT NULL DEFAULT '', 
                description TEXT NOT NULL DEFAULT '',  
                createdAt DATETIME NOT NULL, 
                updatedAt DATETIME NOT NULL, 
                userId INTEGER NOT NULL DEFAULT -1 
                REFERENCES Users (id) ON DELETE CASCADE ON UPDATE CASCADE
                );
            `);

        this.log('Creating the Tasks records...');

        await this.createTasks(this.tasks);

        this.log('Database successfully initialized!');
    }
}

module.exports = Database;