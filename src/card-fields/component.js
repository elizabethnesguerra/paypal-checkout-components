/* @flow */
/* @jsx jsxDom */
/* eslint max-lines: 0 */

import { ZalgoPromise } from 'zalgo-promise/src';
import { create, type ZoidComponent } from 'zoid/src';
import type { CrossDomainWindowType } from 'cross-domain-utils/src';
import { noop, once, inlineMemoize } from 'belter/src';
import { getLocale, getEnv, getCommit, getSDKMeta } from '@paypal/sdk-client/src';

import { getButtonSessionID, getSessionID } from '../lib';
import { getCardUrl } from '../config';

type CardProps = {|
    client : {
        [string] : (string | ZalgoPromise<string>)
    },
    env? : string,
    locale? : string,
    logLevel : string,
    awaitPopupBridge : Function,
    onAuthorize : ({ returnUrl : string }, { redirect : (?CrossDomainWindowType, ?string) => ZalgoPromise<void> }) => ?ZalgoPromise<void>,
    onCancel ? : ({ cancelUrl : string }, { redirect : (? CrossDomainWindowType, ? string) => ZalgoPromise<void> }) => ?ZalgoPromise<void>,
    onEvent ? : ({ type : string, payload : Object }) => void,
    meta : Object,
    commit : boolean,
    token : string
|};

export function getCardFieldsComponent() : ZoidComponent<CardProps> {
    return inlineMemoize(getCardFieldsComponent, () => {
        // $FlowFixMe
        const cardFields = create({
            tag:  'card-fields',
            name: 'ppcard',

            url: getCardUrl,

            dimensions: {
                height: '300px',
                width:  '100%'
            },

            autoResize: {
                height: true,
                width:  false
            },

            props: {
                sessionID: {
                    type:     'string',
                    required: false,
                    def() : string {
                        return getSessionID();
                    },
                    queryParam: true
                },

                // $FlowFixMe
                createOrder: {
                    type:       'function',
                    queryParam: 'token',
                    alias:      'payment',
                    queryValue: ({ value }) => {
                        return ZalgoPromise.try(value);
                    }
                },

                buttonSessionID: {
                    type:     'string',
                    required: false,
                    def() : ?string {
                        return getButtonSessionID();
                    },
                    queryParam: true
                },

                commit: {
                    type:       'boolean',
                    queryParam: true,
                    value:      getCommit
                },

                env: {
                    type:       'string',
                    queryParam: true,
                    // $FlowFixMe
                    value:      getEnv
                },

                locale: {
                    type:          'object',
                    queryParam:    'locale.x',
                    allowDelegate: true,
                    queryValue({ value }) : string {
                        const { lang, country } = value;
                        return `${ lang }_${ country }`;
                    },
                    // $FlowFixMe
                    value: () => getLocale()
                },

                onApprove: {
                    type:  'function',
                    alias: 'onAuthorize'
                },

                onAuth: {
                    type:       'function',
                    required:   false,
                    sameDomain: true
                },

                onCancel: {
                    type:     'function',
                    required: false,
                    decorate: ({ value, close, onError }) => {
                        return once((data, actions = {}) : ZalgoPromise<void> => {
                            return ZalgoPromise.try(() => {
                                // $FlowFixMe
                                return value(data, actions);
                            }).catch(err => {
                                return onError(err);
                            }).finally(() => {
                                close();
                            });
                        });
                    },

                    // $FlowFixMe
                    default: () => noop
                },

                sdkMeta: {
                    type:       'string',
                    queryParam: true,
                    // $FlowFixMe
                    value:      getSDKMeta
                },

                style: {
                    type:       'object',
                    required:   false,
                    queryParam: true,
                    def() : Object {
                        return {
                            cardIcons: {
                                display: false
                            },
                            submitButton: {
                                display: true
                            },
                            currencyConversion: {
                                display: true
                            }
                        };
                    }
                }
            }
        });

        return cardFields;
    });
}
