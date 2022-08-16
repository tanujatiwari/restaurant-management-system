/* Replace with your SQL commands */
-- upload(id,name,path,created_at,category(restaurant,dishes))
create table images (
    id uuid default uuid_generate_v4 () ,
    name varchar(30) not null,
    path text not null,
    created_at timestamp,
    category varchar(10),
    archived_at timestamp default null,
    primary key(id)
);

create table restaurant_upload_details(
    restaurant_id uuid,
    image_id uuid references images(id),
    primary key(restaurant_id,image_id)
);

create table dish_upload_detail(
    dish_id uuid,
    image_id uuid references images(id),
    primary key(dish_id, image_id)
);
