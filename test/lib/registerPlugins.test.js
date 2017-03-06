'use strict';

const Assert = require('chai').assert;
const mockery = require('mockery');
const sinon = require('sinon');

sinon.assert.expose(Assert, { prefix: '' });

describe('Register Unit Test Case', () => {
    const expectedPlugins = [
        'inert',
        'vision',
        '../plugins/status',
        '../plugins/logging',
        '../plugins/swagger',
        '../plugins/validator'
    ];
    const resourcePlugins = [
        '../plugins/auth',
        '../plugins/builds',
        '../plugins/events',
        '../plugins/jobs',
        '../plugins/pipelines',
        '../plugins/secrets',
        '../plugins/templates',
        '../plugins/webhooks',
        '../plugins/stats'
    ];
    const pluginLength = expectedPlugins.length + resourcePlugins.length;
    const mocks = {};
    const config = {};
    let main;
    let serverMock;

    before(() => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache: true
        });
    });

    beforeEach(() => {
        serverMock = {
            register: sinon.stub()
        };

        expectedPlugins.forEach((plugin) => {
            mocks[plugin] = sinon.stub();
            mockery.registerMock(plugin, mocks[plugin]);
        });

        resourcePlugins.forEach((plugin) => {
            mocks[plugin] = sinon.stub();
            mockery.registerMock(plugin, mocks[plugin]);
        });
        /* eslint-disable global-require */
        main = require('../../lib/registerPlugins');
        /* eslint-enable global-require */
    });

    afterEach(() => {
        mockery.deregisterAll();
        mockery.resetCache();
        main = null;
    });

    after(() => {
        mockery.disable();
    });

    it('registered all the default plugins', () => {
        serverMock.register.callsArgAsync(2);

        return main(serverMock, config).then(() => {
            Assert.equal(serverMock.register.callCount, pluginLength);
            expectedPlugins.forEach((plugin) => {
                Assert.calledWith(serverMock.register, mocks[plugin], {
                    routes: {
                        prefix: '/v4'
                    }
                });
            });
        });
    });

    it('registered resource plugins', () => {
        serverMock.register.callsArgAsync(2);

        return main(serverMock, config).then(() => {
            Assert.equal(serverMock.register.callCount, pluginLength);

            resourcePlugins.forEach((plugin) => {
                Assert.calledWith(serverMock.register, {
                    register: mocks[plugin],
                    options: {}
                }, {
                    routes: {
                        prefix: '/v4'
                    }
                });
            });
        });
    });

    it('bubbles failures up', () => {
        serverMock.register.callsArgWithAsync(2, new Error('failure loading'));

        return main(serverMock, config)
            .then(() => {
                throw new Error('should not be here');
            })
            .catch((err) => {
                Assert.equal(err.message, 'failure loading');
            });
    });

    it('registers data for plugin when specified in the config object', () => {
        serverMock.register.callsArgAsync(2);

        return main(serverMock, {
            auth: {
                foo: 'bar'
            }
        }).then(() => {
            Assert.equal(serverMock.register.callCount, pluginLength);

            Assert.calledWith(serverMock.register, {
                register: mocks['../plugins/auth'],
                options: {
                    foo: 'bar'
                }
            }, {
                routes: {
                    prefix: '/v4'
                }
            });
        });
    });
});
