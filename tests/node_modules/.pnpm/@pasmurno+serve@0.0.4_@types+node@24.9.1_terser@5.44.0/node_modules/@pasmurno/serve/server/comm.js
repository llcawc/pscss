import { Command } from 'commander';
import server from './viteview.js';
const program = new Command();
const header = '\n• Vite based live server for static files\n  @pasmurno/serve v.0.0.4\n';
const footer = '\nMIT License ©2025 pasmurno by llcawc. Made with ❤ to beautiful architecture.';
const example = '\nExample call:\n' +
    '  • $ serve  // global use, default port: 3000, default folder: "dist"\n' +
    '  • $ serve -p 4200 -d build --host  // listen on all addresses\n' +
    '  • $ npx serve --port 8000 --dist "./static"  // for local use';
program.name('$ serve').usage('[options]');
program.version('v.0.0.4', '-v, --version', 'output the current version');
program.addHelpText('before', header).addHelpText('after', example).addHelpText('afterAll', footer);
program
    .option('-p, --port <n>', 'server port number (default: 3000)')
    .option('-d, --dist [value]', 'folder for serve files (default: dist)')
    .option('-s, --host', 'listen on all addresses, including LAN and public addresses');
program.parse(process.argv);
const options = program.opts();
server(options);
