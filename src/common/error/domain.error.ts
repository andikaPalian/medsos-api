export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DuplicateEntryError extends DomainError {
  public readonly field: string;
  constructor(field: string, message?: string) {
    super(message ?? `Duplicate value on field: ${field}`);
    this.field = field;
  }
}

export class RecordNotFoundError extends DomainError {
  public readonly entity: string;

  constructor(entity: string, message?: string) {
    super(message ?? `${entity} not found`);
    this.entity = entity;
  }
}

export class DatabaseError extends DomainError {
  public readonly code?: string;

  constructor(message?: string, code?: string) {
    super(message ?? "Unexpected database error");
    this.code = code;
  }
}

export class RelatedRecordNotFoundError extends DomainError {
  constructor(message?: string) {
    super(message ?? "Related record not found");
  }
}
