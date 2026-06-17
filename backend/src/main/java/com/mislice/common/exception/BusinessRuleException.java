package com.mislice.common.exception;

import org.springframework.http.HttpStatus;

/** Thrown when a request is well-formed but violates a business rule. */
public class BusinessRuleException extends ApiException {
    public BusinessRuleException(String code, String message) {
        super(HttpStatus.CONFLICT, code, message);
    }
}
