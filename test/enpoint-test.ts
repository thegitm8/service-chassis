import { assert } from 'chai';
import { Endpoint } from '../src/endpoint';
import MemoryPlugin from '../src/memory-plugin';

describe('Endpoint', () => {
    describe('connect', () => {

        it('Can connect', done => {

            const plugin = new MemoryPlugin();
            const instanceLeft = new Endpoint(plugin);
            const instanceRight = new Endpoint(plugin);

            instanceLeft.connect({ channelName: 'channelName' }, endpoint => {
                assert.isNull(endpoint);
                instanceRight.listen({ channelName: 'channelName' }, leftListenEndpoint => {

                    assert.isNotNull(leftListenEndpoint, 'instanceRight listen');

                    instanceLeft.connect({ channelName: 'channelName' }, leftConnectEndpoint => {

                        assert.isNotNull(leftConnectEndpoint, `InstanceLeft connect ${endpoint}`);

                        instanceRight.close(rightCloseEndpoint => {

                            assert.isNotNull(rightCloseEndpoint, 'InstanceRight close');

                            instanceLeft.close(leftCloseEndpoint => {

                                assert.isNotNull(leftCloseEndpoint, 'InstanceLeft close');

                                done();

                            });
                        });
                    });
                });
            });
        });

        it('can close connections', done => {

            const plugin = new MemoryPlugin();
            const instance = new Endpoint(plugin);

            instance.close(endpoint => {

                assert.isNull(endpoint);

                instance.listen({ channelName: 'channelName' }, listenEndpoint => {

                    assert.isNotNull(listenEndpoint);

                    instance.close(closeEndpoint => {

                        assert.isNotNull(closeEndpoint);

                        instance.close(secondCloseEndpoint => {

                            assert.isNull(secondCloseEndpoint);

                            done();

                        });
                    });
                });
            });
        });
    });

    describe('double Connect/listen', () => {
        it('listen:listen', done => {

            const plugin = new MemoryPlugin();
            const instance = new Endpoint(plugin);

            instance.listen({ channelName: 'channelName' }, listenEndpoint => {

                assert.isNotNull(listenEndpoint);

                instance.listen({ channelName: 'channelName' }, secondListenEndpoint => {

                    assert.isNull(secondListenEndpoint);

                    instance.close(closeEndpoint => {

                        assert.isNotNull(closeEndpoint);

                        done();
                    });

                });

            });
        });

        it('listen:connect', done => {

            const plugin = new MemoryPlugin();
            const instance = new Endpoint(plugin);

            instance.listen({ channelName: 'channelName' }, listenEndpoint => {

                assert.isNotNull(listenEndpoint);

                instance.connect({ channelName: 'channelName' }, connectEndpoint => {

                    assert.isNull(connectEndpoint);

                    instance.close(closeEndpoint => {

                        assert.isNotNull(closeEndpoint);

                        done();
                    });

                });

            });
        });

        it('connect:listen', done => {

            const plugin = new MemoryPlugin();
            const instance = new Endpoint(plugin);

            instance.connect({ channelName: 'channelName' }, connectEndpoint => {

                assert.isNull(connectEndpoint, 'instance connect');

                instance.listen({ channelName: 'channelName' }, listenEndpoint => {

                    assert.isNotNull(listenEndpoint, 'instance listen after connect');

                    instance.close(closeEndpoint => {

                        assert.isNotNull(closeEndpoint);

                        done();
                    });

                });

            });
        });

        it('connect:connect', done => {

            const plugin = new MemoryPlugin();
            const instance = new Endpoint(plugin);

            instance.connect({ channelName: 'channelName' }, connectEndpoint => {

                assert.isNull(connectEndpoint, 'instance connect');

                instance.connect({ channelName: 'channelName' }, secondConnectEndpoint => {

                    assert.isNull(secondConnectEndpoint, 'instance listen after connect');

                    done();

                });

            });
        });

    });

    describe('send/bind', () => {

        it('cannot send if not connected.', done => {

            const plugin = new MemoryPlugin();
            const instance = new Endpoint(plugin);

            instance.send('TEST', endpoint => {

                assert.isNull(endpoint);
                done();

            });

        });

        it('can send if connected.', done => {

            const plugin = new MemoryPlugin();
            const server = new Endpoint(plugin);

            server.listen({ channelName: 'channelName' }, endpoint => {

                server.send('TEST', sendEndpoint => {

                    assert.isNull(sendEndpoint);

                    server.close(closeEndpoint => {

                        assert.isNotNull(closeEndpoint);
                        done();

                    });

                });
            });
        });

        it('can send to client and receive call back.', done => {

            const plugin = new MemoryPlugin();
            const server = new Endpoint(plugin);
            const client = new Endpoint(plugin);

            server.listen({ channelName: 'server' }, endpoint => {

                assert.isNotNull(endpoint);

                client.connect({ channelName: 'server' }, connectEndpoint => {

                    assert.isNotNull(connectEndpoint);

                    client.bind(msg => {

                        assert.equal(msg, 'TEST');

                        client.send('GOTCHA', sendEndpoint => {

                            assert.isNotNull(sendEndpoint);

                        });

                    });

                    server.bind( msg => {

                        assert.equal(msg, 'GOTCHA');

                        server.close(servercloseEndpoint => {

                            assert.isNotNull(servercloseEndpoint, 'server close');

                            client.close (clientCloseEndpoint => {

                                assert.isNotNull(clientCloseEndpoint, 'client close');
                                done();
                            });
                        });
                    });

                    server.send('TEST', serverSendEndpoint => {

                        assert.isNotNull(serverSendEndpoint);

                    });
                });
            });

        });
    });
});
