import * as shell from 'shelljs';

// Copy all the view templates
// shell.cp('-R', ['src/global/views', 'src/messages/views'], 'dist/');
shell.cp('-R', 'src/global/views', 'dist/global/');
shell.cp('-R', 'src/user/views', 'dist/user/');
shell.cp('-R', 'src/messages/views', 'dist/messages/');
shell.cp('-R', 'src/public', 'dist/');
