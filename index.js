const {getAllFilePathsWithExtension, readFile} = require('./fileSystem');
const {readLine} = require('./console');
const path = require('path');

const COMMANDS = {
    EXIT: commandExit,
    SHOW: commandShow,
    IMPORTANT: commandImportant,
    USER: commandUser,
    SORT_IMPORTANCE: commandSortImportance,
    SORT_USER: commandSortUser,
    SORT_DATE: commandSortDate,
    DATE: commandDate,
};
const FILES = getFiles();
const TODOS = getAllTodos(FILES);

console.log('Please, write your command!');
readLine(processCommand);

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(filePath => {
        return {
            fileName: path.win32.basename(filePath),
            data: readFile(filePath),
        }
    });
}

function processCommand(command) {
    const method = commandSearch(command);
    if (method) {
        method(command);
    } else {
        console.log('wrong command');
    }
}

function commandSearch(command) {
    if (command === 'exit')
        return COMMANDS.EXIT;
    if (command === 'show')
        return COMMANDS.SHOW;
    if (command === 'important')
        return COMMANDS.IMPORTANT;
    if (command.match(/^user [a-zа-я0-9_\s]+$/g))
        return COMMANDS.USER;
    if (command.match(/^sort importance$/g))
        return COMMANDS.SORT_IMPORTANCE;
    if (command.match(/^sort user$/g))
        return COMMANDS.SORT_USER;
    if (command.match(/^sort date$/g))
        return COMMANDS.SORT_DATE;
    if (command.match(/^((date [0-9]{4}-[0-9]{2}-[0-9]{2}|date [0-9]{4}-[0-9]{2})|date [0-9]{4})$/g))
        return COMMANDS.DATE;
    return null;
}

function commandExit() {
    process.exit(0);
}

function commandShow() {
    createTable(TODOS);
}

function commandImportant() {
    createTable(TODOS
        .filter(todo => todo.importance > 0));
}

function commandUser(command) {
    const user = command.replace('user ', '').trim().toLowerCase();
    createTable(TODOS
        .filter(todo => todo.user && todo.user.toLowerCase() === user));
}

function commandSortImportance() {
    createTable(TODOS
        .sort((a, b) => b.importance - a.importance));
}

function commandSortUser() {
    createTable(TODOS
        .sort((a, b) => (a.user && b.user) ? (a.user).localeCompare(b.user, 'ru', {caseFirst: 'upper'}) :
            a.user ? -1 : b.user ? 1 : 0));
}

function commandSortDate() {
    createTable(TODOS
        .sort((a, b) => {
            return (a.date && b.date) ? b.date.date - a.date.date :
                a.date ? -1 : b.date ? 1 : 0;
        }));
}

function commandDate(command) {
    const date = new Date(command.match(/(([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{4}-[0-9]{2})|[0-9]{4})$/g)[0]);
    createTable(TODOS
        .filter(todo => todo.date && todo.date.date > date));
}

//toDo:Alex;2020-10;добавить writeLine!!!

// TODO you can do it!
// TODO ; 2016; добавить writeLine!!!
// TODO ; ; добавить writeLine!!!

function getAllTodos(files) {
    let todos = [];
    files.forEach(file => {
        const newTodo = file.data.match(/\/\/\s?todo(\s|:).+/gi).map(el => {
            return {
                fileName: file.fileName,
                comment: el,
            }
        });
        todos.push(...newTodo);
    });
    todos = todos.map(todo => {
        const arr = todo.comment.replace(/\/\/\s?todo(\s|:)/gi, '').split(';').map(e => e.trim());
        let newTodo = {};
        newTodo.fileName = todo.fileName;
        const importance = todo.comment.match(/!/g) || [];
        newTodo.importance = importance.length;
        if (arr.length === 1) {
            newTodo.text = arr[0].trim();
        } else if (arr.length === 3) {
            const user = arr[0].trim();
            newTodo.user = user && user.length > 0 ? user : null;
            const dateAsText = arr[1].trim();
            const dateAssArray = dateAsText.split('-');
            const date = new Date(dateAsText);
            newTodo.date = {
                date: date,
                year: dateAssArray[0] ? Number(dateAssArray[0]) : null,
                month: dateAssArray[1] ? Number(dateAssArray[1]) : null,
                day: dateAssArray[2] ? Number(dateAssArray[2]) : null,
            };
            newTodo.text = arr[2].trim();
        }
        return formatTodo(newTodo);
    });
    // console.log(todos, todos.length);
    return todos;
}

function formatTodo(todo) {
    const ending = '…';
    const importance = todo.importance > 0 ? '!' : '';
    const user = todo.user ? todo.user.length > 10 ?
        trimString(todo.user, ending, 0, 10)
        : todo.user
        : '';
    const date = (todo.date && todo.date.year) ? (todo.date.day && todo.date.month) ?
        `${todo.date.year.toString().padStart(4, '0')}-${todo.date.month.toString().padStart(2, '0')}-${todo.date.day.toString().padStart(2, '0')}`
        : (todo.date.month) ? `${todo.date.year.toString().padStart(4, '0')}-${todo.date.month.toString().padStart(2, '0')}`
            : `${todo.date.year.toString().padStart(4, '0')}`
        : '';
    const text = todo.text.length > 50 ? trimString(todo.text, ending, 0, 50) : todo.text;
    const fileName = todo.fileName.length > 10 ? trimString(todo.fileName, ending, 0, 10) : todo.fileName;

    return {
        ...todo,
        fieldsForPrint: {
            importance,
            user,
            date,
            text,
            fileName,
        },
        fieldSize: {
            importance: importance.length,
            user: user.length,
            date: date.length,
            text: text.length,
            fileName: fileName.length,
        }
    }
}

function trimString(str, ending, start, length) {
    return str.slice(start, length - ending.length) + ending;
}

function createTable(todos) {
    const head = formatTodo({
        importance: 1,
        user: 'user',
        date: {year: 'date'},
        text: 'comment',
        fileName: 'file',
    });
    const [maxI, maxU, maxD, maxT, maxF] = getMaxLength([head, ...todos]);
    const aggregate = ' ';
    const widthTable = maxI + maxU + maxD + maxT + maxF + 6 + 4 * 5;

    function printRow(importance, user, date, text, fileName) {
        console.log(`|  ${importance}  |  ${user}  |  ${date}  |  ${text}  |  ${fileName}  |`);
    }

    function centeringText(text, lineLength, filler = ' ') {
        return text.padStart(lineLength / 2 + text.length / 2 - 1, filler).padEnd(lineLength, filler);
    }

    console.log(centeringText('RESULTS', widthTable, '-'));
    console.log('-'.repeat(widthTable));
    printRow(
        head.fieldsForPrint.importance.padEnd(maxI, aggregate),
        head.fieldsForPrint.user.padEnd(maxU, aggregate),
        head.fieldsForPrint.date.padEnd(maxD, aggregate),
        head.fieldsForPrint.text.padEnd(maxT, aggregate),
        head.fieldsForPrint.fileName.padEnd(maxF, aggregate)
    )
    console.log('-'.repeat(widthTable));
    if (todos.length > 0)
        todos.forEach(todo => {
            printRow(
                todo.fieldsForPrint.importance.padEnd(maxI, aggregate),
                todo.fieldsForPrint.user.padEnd(maxU, aggregate),
                todo.fieldsForPrint.date.padEnd(maxD, aggregate),
                todo.fieldsForPrint.text.padEnd(maxT, aggregate),
                todo.fieldsForPrint.fileName.padEnd(maxF, aggregate)
            )
        });
    else
        console.log(`|${centeringText('NO RESULTS', widthTable - 2, ' ')}|`);
    console.log('-'.repeat(widthTable));
}

function getMaxLength(todos, maxImportance = 1, maxUser = 10, maxDate = 10, maxText = 50, maxFileName = 10) {
    let currentSizeImportance = 0, currentSizeUser = 0, currentSizeDate = 0, currentSizeText = 0,
        currentSizeFileName = 0;
    todos.forEach(todo => {
        currentSizeImportance = tryUpdateFieldSize(todo.fieldSize.importance, currentSizeImportance);
        currentSizeUser = tryUpdateFieldSize(todo.fieldSize.user, currentSizeUser);
        currentSizeDate = tryUpdateFieldSize(todo.fieldSize.date, currentSizeDate);
        currentSizeText = tryUpdateFieldSize(todo.fieldSize.text, currentSizeText);
        currentSizeFileName = tryUpdateFieldSize(todo.fieldSize.fileName, currentSizeFileName);
    });

    function tryUpdateFieldSize(fieldSize, currentSize) {
        return (fieldSize > currentSize) ? fieldSize : currentSize;
    }

    return [
        currentSizeImportance <= maxImportance ? currentSizeImportance : maxImportance,
        currentSizeUser <= maxUser ? currentSizeUser : maxUser,
        currentSizeDate <= maxDate ? currentSizeDate : maxDate,
        currentSizeText <= maxText ? currentSizeText : maxText,
        currentSizeFileName <= maxFileName ? currentSizeFileName : maxFileName
    ];
}