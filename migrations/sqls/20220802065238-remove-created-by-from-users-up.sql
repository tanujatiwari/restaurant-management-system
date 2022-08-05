/* Replace with your SQL commands */

alter table users drop column created_by;

alter table roles add column created_by uuid;