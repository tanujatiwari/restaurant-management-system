/* Replace with your SQL commands */

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table users(
    id uuid default uuid_generate_v4 (),
    email varchar(60) not null unique,
    password text,
    name varchar(40) not null,
    primary key (id)
);

create table roles(
    user_id uuid,
    role varchar(10) not null,
    is_archived boolean default false,
    primary key (user_id,role),
    foreign key (user_id) references users (id)
);

create table sessions(
    id uuid,
    session_id uuid default uuid_generate_v4 (),
    start_time timestamptz default NOW(),
    end_time timestamptz,
    primary key (id,session_id),
    foreign key (id) references users (id)
);

create table restaurants(
    id uuid default uuid_generate_v4 (),
    user_id uuid,
    name varchar(40) not null,
    location point,
    ratings numeric(2,1),
    is_archived boolean default false,
    primary key (id),
    foreign key(user_id) references users (id)
);

create table dishes(
    id uuid default uuid_generate_v4 (),
    restaurant_id uuid,
    name varchar(30) not null not null,
    description varchar(300),
    is_archived boolean default false,
    primary key (id),
    foreign key (restaurant_id) references restaurants (id)
);

create table reviews(
    id uuid default uuid_generate_v4 (),
    user_id uuid,
    restaurant_id uuid,
    review text not null,
    created_on timestamptz default NOW(),
    deleted_on timestamptz,
    is_archived boolean default false,
    foreign key (user_id) references users(id),
    foreign key (restaurant_id) references restaurants (id)
);