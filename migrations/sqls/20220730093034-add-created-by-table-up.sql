/* Replace with your SQL commands */

alter table users drop column created_by;

create EXTENSION if not exists "uuid-ossp";

create table created_by(
    user_id uuid,
    created_by uuid,
    primary key(user_id,created_by)
);