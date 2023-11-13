const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");

const configPath = process.env.POPULATE_DATABASE_PATH;
const resourcesPath = path.resolve(configPath, 'resources');
const templatesPath = path.resolve(resourcesPath, 'templates');

const templates = fs.readdirSync(templatesPath, { withFileTypes: true })
                    .filter(dir => dir.isDirectory())
                    .map(dir => ({
                        name: dir.name,
                        id: dir.name
                    }));

function getTemplateContextList(templatePath){
    const contextsPath = path.resolve(templatePath, 'context');

    return fs.readdirSync(contextsPath, { withFileTypes: true })
            .filter(file => path.extname(file.name) === '.json')
            .map(file => ({
                name: path.basename(file.name),
                context: fs.readFileSync(path.resolve(contextsPath, file.name), 'utf8')
            }));
}

function getTemplateTables(templatePath){
    const tablesPath = path.resolve(templatePath, 'tables');
    return fs.readdirSync(tablesPath, { withFileTypes: true })
            .filter(file => path.extname(file.name) === '.json')
            .map(file => {
                const details = fs.readFileSync(path.resolve(tablesPath, file.name), 'utf8');
                return {
                    name: JSON.parse(details).TableName,
                    details: details
                }
            });
}

function getTemplateItemDetails(itemsPath){
    return fs.readdirSync(itemsPath, { withFileTypes: true })
            .filter(file => path.extname(file.name) === '.json')
            .map(file => ({
                name: file.name.replace('.json', ''),
                details: fs.readFileSync(path.resolve(itemsPath, file.name), 'utf8')
            }));
}

function getTemplateItems(templatePath){
    const itemsPath = path.resolve(templatePath, 'items');
    return fs.readdirSync(itemsPath, { withFileTypes: true })
            .filter(file => file.isDirectory())
            .reduce((templateMap, file) => {
                return {
                    ...templateMap,
                    [file.name]: getTemplateItemDetails(path.resolve(itemsPath, file.name))
                }
            }, {});

}

function getTemplateContext(templateId){
    const templatePath = path.resolve(templatesPath, templateId);

    return {
        id: templateId,
        name: templateId,
        contexts: getTemplateContextList(templatePath),
        tables: getTemplateTables(templatePath),
        items: getTemplateItems(templatePath)
    };
}

function getTemplates(){
    return templates;
}

function populateDatabase(templateId, templateContext){
    const cmd = `python3 ${configPath}/populate_database.py -l -t ${templateId} -cc '${JSON.stringify(templateContext)}'`;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
         resolve({
            cmd,
            error,
            stdout,
            stderr
         });
        });
    });
}

module.exports = {
    getTemplateContext,
    getTemplates,
    populateDatabase
}