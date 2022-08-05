/* Replace with your SQL commands */

alter table users add column is_archived boolean default false; 

create table addresses(
    user_id uuid,
    address text,
    geopoint point,
    is_archived boolean default false,
    primary key (user_id,address),
    foreign key (user_id) references users (id)
);