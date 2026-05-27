// ===========================================================================
// shell.test.js
//
// Unit tests for the shell.js module.
// Uses Jest as the testing framework.
// ===========================================================================

jest.mock('child_process', () => ({
    exec: jest.fn(),
    execFile: jest.fn()
}));
jest.mock('debug', () => () => jest.fn());

const childProcess = require('child_process');
const shell = require('../lib/shell.js');

describe('shell.js', () => {
    let io;

    beforeEach(() => {
        io = { emit: jest.fn() };
        jest.clearAllMocks();
    });

    describe('reboot', () => {
        it('should emit server-reboot on successful exec', () => {
            childProcess.exec.mockImplementation((cmd, cb) => cb(null, '', ''));

            shell.reboot(io);

            expect(childProcess.exec).toHaveBeenCalledWith(
                '/usr/bin/sudo systemctl reboot',
                expect.any(Function)
            );
            expect(io.emit).toHaveBeenCalledWith('server-reboot', 'Rebooting...');
        });

        it('should emit server-reboot with error message if exec returns an error', () => {
            childProcess.exec.mockImplementation((cmd, cb) => cb(new Error('error'), '', 'error'));

            shell.reboot(io);

            expect(io.emit).toHaveBeenCalledWith('server-reboot', 'error');
        });
    });

    describe('shutdown', () => {
        it('should emit server-shutdown on successful exec', () => {
            childProcess.exec.mockImplementation((cmd, cb) => cb(null, '', ''));

            shell.shutdown(io);

            expect(childProcess.exec).toHaveBeenCalledWith(
                '/usr/bin/sudo systemctl poweroff',
                expect.any(Function)
            );
            expect(io.emit).toHaveBeenCalledWith('server-shutdown', 'Shutting down...');
        });

        it('should emit server-shutdown with error message if exec returns an error', () => {
            childProcess.exec.mockImplementation((cmd, cb) => cb(new Error('error'), '', 'error'));

            shell.shutdown(io);

            expect(io.emit).toHaveBeenCalledWith('server-shutdown', 'error');
        });
    });

    describe('update', () => {
        it('should emit updating then ok when git pull and npm install succeed', () => {
            // git pull uses execFile(file, args, callback) - 3 args
            childProcess.execFile.mockImplementationOnce((file, args, cb) => {
                cb(null, 'Already up to date.', '');
            });
            // npm install uses execFile(file, args, options, callback) - 4 args
            childProcess.execFile.mockImplementationOnce((file, args, opts, cb) => {
                cb(null, 'added 0 packages', '');
            });

            shell.update(io);

            expect(io.emit).toHaveBeenCalledWith('server-update', { status: 'updating' });
            expect(io.emit).toHaveBeenCalledWith('server-update', {
                status: 'ok',
                git: 'Already up to date.',
                npm: 'added 0 packages'
            });
        });

        it('should emit error when git pull fails', () => {
            const gitErr = new Error('Git pull failed');
            childProcess.execFile.mockImplementationOnce((file, args, cb) => {
                cb(gitErr, '', 'fatal: not a git repo');
            });

            shell.update(io);

            expect(io.emit).toHaveBeenCalledWith('server-update', { status: 'updating' });
            expect(io.emit).toHaveBeenCalledWith('server-update', expect.objectContaining({
                status: 'error',
                git: gitErr,
                stderr: 'fatal: not a git repo'
            }));
        });

        it('should emit error when npm install fails after successful git pull', () => {
            const npmErr = new Error('npm install failed');
            childProcess.execFile.mockImplementationOnce((file, args, cb) => {
                cb(null, 'Already up to date.', '');
            });
            childProcess.execFile.mockImplementationOnce((file, args, opts, cb) => {
                cb(npmErr, '', 'npm ERR! code ENOENT');
            });

            shell.update(io);

            expect(io.emit).toHaveBeenCalledWith('server-update', { status: 'updating' });
            expect(io.emit).toHaveBeenCalledWith('server-update', expect.objectContaining({
                status: 'error',
                npm: npmErr,
                stderr: 'npm ERR! code ENOENT'
            }));
        });
    });
});
