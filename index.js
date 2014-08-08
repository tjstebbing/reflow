var async = require("async");

module.exports = function(get, set, workflow) {

    return function(obj, targetState, callback) {
        if(!workflow.hasOwnProperty(targetState)) {
            // There is no such state defined
            return callback({err : targetState+' is not a defined state.'});
        }

        get(obj, function(err, currentState) {
            if(err) return callback(err);
            var current = workflow[currentState];
            if(!current.hasOwnProperty(targetState)) {
                // Current state has no transition to target state
                return callback({err : targetState + ' is not a valid transition from state ' + currentState});
            }
            var transition = current[targetState];
            var conditionErrors = []
            //Run any condition functions to see if we can proceed
            async.every(transition.conditions||[], function(cond, cb) {
                return cond(obj, targetState, function(err, bool) {
                    if(err) {
                        conditionErrors.push(err);
                        return cb(false);
                    } else if(!bool) {
                        conditionErrors.push({err : 'condition failed: '+ cond.name});
                    }
                    return cb(bool);
                });
            }, function(conditionsOk) {
                if(!conditionsOk) return callback(conditionErrors);
                return set(obj, targetState, function(err) {
                    if(err) return callback(err);
                    //Run any trigger functions now state is set
                    async.each(transition.triggers||[], function(t, cb){
                        return t(obj, cb);
                    }, function(err) {
                        return callback(err, obj);
                    });
                });

            });
        });
    }
}
