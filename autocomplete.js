/*
 * Autocomplete.js v1.4.0 unstable
 * Developed by Baptiste Donaux
 * 
 * Under MIT Licence
 * (c) 2014, Baptiste Donaux
 */
"use strict";
var AutoComplete = function(params) {
    //Construct
    this.params = params;
    this.custParams = [];
    this.Init();

    for (var i = this.params.selector.length - 1; i >= 0; i--) {
        this.BindCollection(this.params.selector[i]);
    }
};

AutoComplete.prototype.BindOne = function(input) {
    if (input) {
        var dataAutocompleteOldValueLabel = "data-autocomplete-old-value",
            result = this.DOMCreate("div"),
            request;
        
        this.Attr(input, {"autocomplete": "off"});
        
        this.Position(input, result);

        input.addEventListener("autocomplete:position", function() {
            this.Position(input, result);
        });

        input.parentNode.appendChild(result);
        
        var self = this;

        input.addEventListener("focus", function() {
            var dataAutocompleteOldValue = self.Attr(input, dataAutocompleteOldValueLabel);
            if (!dataAutocompleteOldValue || input.value != dataAutocompleteOldValue) {
                self.Attr(result, {"class": "autocomplete open"});
            }
        });

        input.addEventListener("blur", function() {
            self.Close(result);
        });

        input.addEventListener("keyup", function(e) {
            var input = e.currentTarget,
                custParams = self.CustParams(input),
                inputValue = custParams.pre(input);

            if (inputValue && custParams.url) {
                var dataAutocompleteOldValue = self.Attr(input, dataAutocompleteOldValueLabel);
                if (!dataAutocompleteOldValue || inputValue != dataAutocompleteOldValue) {
                    self.Attr(result, {"class": "autocomplete open"});
                }

                request = self.Ajax(request, custParams, custParams.paramName + "=" + inputValue, input, result);
            }
        });
    }
};

AutoComplete.prototype.DOMCreate = function(item) {
    return document.createElement(item);
};

AutoComplete.prototype.Ajax = function(request, custParams, queryParams, input, result) {
    if (request) {
        request.abort();
    }
    
    var method = custParams.method,
        url = custParams.url;

    if (method.match("^GET$", "i")) {
        url += "?" + queryParams;
    }

    request = new XMLHttpRequest();
    request.open(method, url, true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.setRequestHeader("Content-length", queryParams.length);
    request.setRequestHeader("Connection", "close");

    request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == 200) {
            if (custParams.post(result, request.response, custParams) !== true) {
                custParams.open(input, result);
            }
        }
    };

    request.send(queryParams);

    return request;
};

AutoComplete.prototype.BindCollection = function(selector) {
    var input,
        inputs = document.querySelectorAll(selector);

    for (var i = inputs.length - 1; i >= 0; i--) {
        input = inputs[i];
        if (input.nodeName.match("^INPUT$", "i") && input.type.match("^TEXT$", "i")) {
            this.BindOne(input);
        }
    }
};

AutoComplete.prototype.Position = function(input, result) {
    this.Attr(result, {
        "class": "autocomplete",
        "style": "top:" + (input.offsetTop + input.offsetHeight) + "px;left:" + input.offsetLeft + "px;width:" + input.clientWidth + "px;"
    });
};

AutoComplete.prototype.Close = function(result, closeNow) {
    if (closeNow) {
        this.Attr(result, {"class": "autocomplete"});
    } else {
        var self = this;
        setTimeout(function() {self.Close(result, true);}, 150);
    }
};

AutoComplete.prototype.Init = function() {
    var
    self = this,
    defaultParams = {
        limit:     0,
        method:    "GET",
        noResult:  "No result",
        paramName: "q",
        open: function(input, result) {
            var lambda = function(li) {
                li.addEventListener("click", function(e) {
                    var li = e.currentTarget,
                        dataAutocompleteValueLabel = "data-autocomplete-value";

                    input.value = li.hasAttribute(dataAutocompleteValueLabel) ? self.Attr(li, dataAutocompleteValueLabel) : li.innerHTML;

                    self.Attr(input, {"data-autocomplete-old-value": input.value});
                });
            };

            var liS = result.getElementsByTagName("li");
            for (var i = liS.length - 1; i >= 0; i--) {
                lambda(liS[i]);
            }
        },
        post: function(result, response, custParams) {            
            try {
                response = JSON.parse(response);
                var empty,
                    length = response.length,
                    li = self.DOMCreate("li"),
                    ul = self.DOMCreate("ul");
                    
                if (Array.isArray(response)) {
                    if (length) {
                        if (custParams.limit < 0) {
                            response.reverse();
                        }

                        for (var i = 0; i < length && (i < Math.abs(custParams.limit) || !custParams.limit); i++) {
                            li.innerHTML = response[i];
                            ul.appendChild(li);
                            li = self.DOMCreate("li");
                        }
                    } else {
                        //If the response is an object or an array and that the response is empty, so this script is here, for the message no response.
                        empty = true;
                        self.Attr(li, {"class": "locked"});
                        li.innerHTML = custParams.noResult;
                        ul.appendChild(li);
                    }
                } else {
                    var properties = Object.getOwnPropertyNames(response);

                    if (custParams.limit < 0) {
                        properties.reverse();
                    }

                    for (var propertie in properties) {
                        if (parseInt(propertie) < Math.abs(custParams.limit) || !custParams.limit) {
                            li.innerHTML = response[properties[propertie]];
                            self.Attr(li, {"data-autocomplete-value": properties[propertie]});
                            ul.appendChild(li);
                            li = self.DOMCreate("li");
                        }
                    }
                }

                if (result.hasChildNodes()) {
                    result.childNodes[0].remove();
                }
                
                result.appendChild(ul);

                return empty;
            } catch (e) {
                result.innerHTML = response;
            }
        },
        pre: function(input) {
            return input.value;
        },
        selector:  ["input[data-autocomplete]"]
    };

    if (this.params === undefined) {
        this.params = {};
    }

    this.params = this.Merge(defaultParams, this.params);

    if (!this.params.method.match("^GET|POST$", "i")) {
        this.params.method = defaultParams.method;
    }

    if (!Array.isArray(this.params.selector)) {
        this.params.selector = defaultParams.selector;
    }
};

AutoComplete.prototype.CreateCustParams = function(input) {
    var params = {
        limit:     "data-autocomplete-limit",
        method:    "data-autocomplete-method",
        noResult:  "data-autocomplete-no-result",
        paramName: "data-autocomplete-param-name",
        url:       "data-autocomplete"
    };

    var paramsAttribute = Object.getOwnPropertyNames(params);
    for (var i = paramsAttribute.length - 1; i >= 0; i--) {
        params[paramsAttribute[i]] = this.Attr(input, params[paramsAttribute[i]]);
    }

    for (var option in params) {
        if (params.hasOwnProperty(option) && !params[option]) {
            delete params[option];
        }
    }

    if (params.method && !params.method.match("^GET|POST$", "i")) {
        delete params.method;
    }

    if (params.limit) {
        if (isNaN(params.limit)) {
            delete params.limit;
        } else {
            params.limit = parseInt(params.limit);
        }
    }

    return this.Merge(this.params, params);
};

AutoComplete.prototype.CustParams = function(input) {
    var dataAutocompleteIdLabel = "data-autocomplete-id";

    if (!input.hasAttribute(dataAutocompleteIdLabel)) {
        input.setAttribute(dataAutocompleteIdLabel, this.custParams.length);

        this.custParams.push(this.CreateCustParams(input));
    }

    return this.custParams[this.Attr(input, dataAutocompleteIdLabel)];
};

AutoComplete.prototype.Merge = function(obj1, obj2) {
    var merge = {};
    
    for (var a in obj1) {
        merge[a] = obj1[a];
    }

    for (var b in obj2) {
        merge[b] = obj2[b];
    }

    return merge;
};

AutoComplete.prototype.Attr = function(item, attrs) {
    if (typeof attrs == "string") {
        return item.getAttribute(attrs);
    }

    for (var key in attrs) {
        item.setAttribute(key, attrs[key]);
    }
};