
const isFunction = (fn) => fn && fn.constructor.name === 'Function';

const actionContinue = function(resolve) {
    this.error = null;

    // clearing timeout as it is no longer needed
    clearTimeout(this.timeoutID);
    resolve();
};

function actionIntercept(reject, reason) {
    this.error = reason;

    // clearing timeout as it is no longer needed
    clearTimeout(this.timeoutID);
    reject(reason);
}

function removeInterceptor(actionName, interceptor) {
    this.removeInterceptor(actionName, interceptor);
}

class Actions {
    constructor() {
        this.list = new Map();
    }

    /**
     *  Registers an action that can be called from other modules.
     *
     *  @param {string} actionName - action name
     *  @param {function | Object} action - function to trigger or action object
     *  @returns {Object} actionDetails
     */
    register(actionName, action) {
        const actionDetails = this.list.get(actionName) || this.setDefaultDetails(actionName);

        if (isFunction(action)) {
            actionDetails.callback = action;
            return actionDetails;
        }

        actionDetails.callback = action.callback;
        actionDetails.canBeIntercepted = Boolean(action.canBeIntercepted == undefined ? true : action.canBeIntercepted);
        actionDetails.interceptors = actionDetails.interceptors.concat(action.interceptors);

        return actionDetails;
    }

    /**
     *  Unregister an action
     *
     *  @param {string} actionName - action name
     */
    removeAction(actionName) {
        this.list.delete(actionName);
    }

    setDefaultDetails(actionName) {
        const details = {
            name: actionName,
            canBeIntercepted: true,
            interceptors: [],
            callback: () => { },
        };
        this.list.set(actionName, details);
        return details;
    }

    /**
     *  Register interceptors that executes before an action is called
     *
     *  @param {string} actionName - Action name
     *  @param {function} interceptor - Interceptor method
     *  @param {Boolean} once - option to trigger the interceptor just one time
     */

    intercept(actionName, callback, once) {
        const action = this.list.get(actionName) || this.setDefaultDetails(actionName);
        action.interceptors.push({
            callback,
            once,
        });


        // this reference is to be able to identify the interceptor on removeInterceptor
        // wrapper.interceptor = interceptor;
    }

    wrapper(actionName, interceptor) {
        const self = this;
        return new Promise(async(resolve, reject) => {
            // the action's context must be created every time before passing it to the interceptor
            // this shields us from a user storing a reference and doing something.
            const context = {
                // we could include the action object itself and let our clients and ourselves
                // access this reference to read and modify things on the interceptor,
                // like swapping the action method tiself depending on some condition
                // all of which, could lead to bad practices, hence we don't do it.
                action_name: actionName,
                error: null,
                timeoutID: 0,
            };

            // multiple calls to intercept() or continue() not have any consequenses
            context.intercept = actionIntercept.bind(context, reject);
            context.continue = actionContinue.bind(context, resolve);
            context.removeInterceptor = removeInterceptor.bind(self, actionName, interceptor.callback);

            // automatically reject the interceptor after N seconds
            context.timeoutID = setTimeout(() => {
                context.intercept('InterceptorTimeout');
            }, 5000);

            await interceptor.callback(context);

            if (interceptor.once) {
                context.removeInterceptor();
            }
        });
    }

    /**
   *  Removes the interceptor from the specified action
   *
   *  @param {string} actionName - action name
   *  @param {function} callback - interceptor to remove
   *  @return {Boolean} returns true if the interceptor was removed correctly
   */
    removeInterceptor(actionName, callback) {
        const actionDetails = this.list.get(actionName);
        let interceptors = [];

        // yes, this could be a ternary operator but we're aiming for more readability
        // plus the minifiers do a lot of these optimizations
        if (actionDetails && actionDetails.interceptors.length) {
            interceptors = actionDetails.interceptors;
        }

        const index = interceptors.findIndex((interceptor) => interceptor.callback === callback);
        if (index > -1) {
            interceptors.splice(index, 1);
            return true;
        }

        return false;
    }

    /**
     *  Broadcast the call to the specified action but first executes the registered interceptors
     *
     *  @param {string} actionName - action name
     *  @param {Object} params - extra params
     */
    async call(actionName, params) {
        const action = this.list.get(actionName);

        if (!action) {
            return Promise.reject('ActionDoesNotExist');
        }

        const context = {
            actionName: action.name,
            params,
        };

        if (action.canBeIntercepted && action.interceptors.length) {
            for (const interceptor of action.interceptors) {
                await this.wrapper(actionName, interceptor);
            }
            return action.callback(context, params);
        }

        return action.callback(context, params);
    }
}
