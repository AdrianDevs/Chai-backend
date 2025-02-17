import * as shell from 'shelljs';

// Copy any assets in the public folder
shell.cp('-R', 'src/public', 'dist/');
