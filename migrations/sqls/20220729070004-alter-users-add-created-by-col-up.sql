/* Replace with your SQL commands */

alter table users add column created_by uuid references users(id);