<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

// CORS preflight handler
$routes->options('(:any)', 'Preflight::handle/$1');


//------------------------------------------------------------------ 
// ------------ User Related Routes --------------------------------
//------------------------------------------------------------------ 
// --- Public
$routes->group('api', static function ($routes) {
    $routes->post('auth/login', 'Auth::login'); // Public login
});

// --- Private (JWT required)
$routes->group('api', ['filter' => ['jwtAuth']], static function ($routes) {
    // Me (self profile)
    $routes->get('me', 'Api\Me::show');                 // Get my profile
    $routes->put('me', 'Api\Me::update');               // Update my name/email
    $routes->put('me/password', 'Api\Me::changePassword'); // Change my password
});

// --- Admin-only (JWT + Admin)
$routes->post('/users', 'Api\Users::create');        // Create user
$routes->group('api/users', ['filter' => ['jwtAuth', 'adminOnly']], static function ($routes) {
    $routes->get('/', 'Api\Users::index');          // Get all users
    $routes->get('(:num)', 'Api\Users::show/$1');   // Get one user
    $routes->put('(:num)', 'Api\Users::update/$1'); // Update a user
    $routes->delete('(:num)', 'Api\Users::delete/$1'); // Delete a user
});


//---------------------------------------------------------------------
// ------------ Inquiry Related Routes --------------------------------
//---------------------------------------------------------------------
// --- Public (create inquiry)
$routes->group('api/public', static function ($routes) {
    $routes->post('inquiries', 'Public\Inquiries::create'); // create + send emails
});

// --- Private reads (JWT)
$routes->group('api/inquiries', ['filter' => ['jwtAuth']], static function ($routes) {
    $routes->get('/', 'Api\Inquiries::index');        // list with search/sort/pagination
    $routes->get('(:num)', 'Api\Inquiries::show/$1'); // get one
});

// --- Admin-only delete
$routes->group('api/inquiries', ['filter' => ['jwtAuth', 'adminOnly']], static function ($routes) {
    $routes->delete('(:num)', 'Api\Inquiries::delete/$1'); // remove
});

//-------------------------------------------------------------------
// ------------ Banner Related Routes --------------------------------
//-------------------------------------------------------------------
// --- Public
$routes->group('api/public', static function ($routes) {
    $routes->get('banners/active', 'Public\Banners::active');
});

// --- Private (JWT: list/show/create/update)
$routes->group('api/banners', ['filter' => ['jwtAuth']], static function ($routes) {
    $routes->get('/', 'Api\Banners::index');          // list with search/pagination/filters
    $routes->get('(:num)', 'Api\Banners::show/$1');   // get one
    $routes->post('/', 'Api\Banners::create');        // create (multipart preferred)
    $routes->put('(:num)', 'Api\Banners::update/$1'); // update (schedule/permanent/active/sort)
});

// --- Admin-only delete
$routes->group('api/banners', ['filter' => ['jwtAuth', 'adminOnly']], static function ($routes) {
    $routes->delete('(:num)', 'Api\Banners::delete/$1');
});

//----------------------------------------------------------------------
// ------------ Category Related Routes --------------------------------
//----------------------------------------------------------------------
// --- Public (no auth)
$routes->group('api/public/categories', static function ($routes) {
    // List categories (tree by default; ?flat=1 for flat list, ?q= for search)
    $routes->get('/', 'Public\Categories::index');
    // Get one by slug (for frontend routing)
    $routes->get('slug/(:segment)', 'Public\Categories::showBySlug/$1');
});

// --- Private (JWT) - admin UI
$routes->group('api/categories', ['filter' => ['jwtAuth']], static function ($routes) {
    $routes->get('/', 'Api\Categories::index');             // list/search/paginate (flat)
    $routes->get('(:num)', 'Api\Categories::show/$1');      // get one by id
    $routes->post('/', 'Api\Categories::create');           // create
    $routes->post('(:num)/update', 'Api\Categories::update/$1');    // update (name/slug/parent/sort_order/description/image_url/meta)
    // optional: quick reorder within same parent
    $routes->post('(:num)/reorder', 'Api\Categories::reorder/$1'); // {sort_order}
});

// --- Admin-only delete
$routes->group('api/categories', ['filter' => ['jwtAuth', 'adminOnly']], static function ($routes) {
    $routes->delete('(:num)', 'Api\Categories::delete/$1');
});





//----------------------------------------------------------------------
// ------------ Product Related Routes ---------------------------------
//----------------------------------------------------------------------


$routes->group('api', ['namespace' => 'App\Controllers\Api'], static function ($routes) {

    // -------- PUBLIC (fallback to 'en' for missing localized bits) --------
    $routes->get('products', 'Products::index');                 // ?locale=&q=&page=&limit=&sortBy=&order=&category_id=
    $routes->get('products/(:segment)', 'Products::show/$1');    // ?locale=

    // -------- ADMIN (strict: NO fallback in details; listing uses same card/table shape) --------
    $routes->group('admin', ['namespace' => 'App\Controllers\Api\Admin'], static function ($routes) {
        $routes->get('products', 'Products::index');                 // ?locale=&q=&page=&limit=&sortBy=&order=&category_id=&status=&type=
        $routes->get('products/(:segment)', 'Products::show/$1');    // ?locale=
    });
});

$routes->group('api/admin', ['namespace' => 'App\Controllers\Api\Admin'], static function ($routes) {
    // Create product (base + initial translation for locale)
    $routes->post('products', 'ProductEditor::create');

    // Update product base (and optionally category link)
    $routes->put('products/(:num)', 'ProductEditor::update/$1');

    // Upsert a single translation (no fallback): create or replace for given locale
    $routes->put('products/(:num)/translation', 'ProductEditor::upsertTranslation/$1');
});


$routes->group('api/admin', ['namespace' => 'App\Controllers\Api\Admin'], static function ($routes) {

    // -------- Lists --------
    // Create list (for locale)
    $routes->post('products/(:num)/contents/lists', 'ProductContents::createList/$1');                 // body: { locale, data{ slug?, title*, description?, items[], sort_order? } }
    // Replace a locale’s list content completely
    $routes->put('products/(:num)/contents/lists/(:num)', 'ProductContents::replaceList/$1/$2');      // body: { locale, data{ slug?, title*, description?, items[], sort_order? } }
    // Delete an entire list (all locales + items)
    $routes->delete('products/(:num)/contents/lists/(:num)', 'ProductContents::deleteList/$1/$2');
    // Delete an entire list (Only recieved locales + items)
    $routes->delete('products/(:num)/contents/lists/(:num)/(:segment)', 'ProductContents::deleteListLocale/$1/$2/$3');

    // -------- Spec Groups --------
    $routes->post('products/(:num)/contents/spec-groups', 'ProductContents::createSpecGroup/$1');               // body: { locale, data{ slug?, title*, description?, items[{key,value,unit?}], sort_order? } }
    $routes->put('products/(:num)/contents/spec-groups/(:num)', 'ProductContents::replaceSpecGroup/$1/$2');     // body: { locale, data{ slug?, title*, description?, items[], sort_order? } }
    $routes->delete('products/(:num)/contents/spec-groups/(:num)', 'ProductContents::deleteSpecGroup/$1/$2');
    $routes->delete('products/(:num)/contents/spec-groups/(:num)/(:segment)', 'ProductContents::deleteSpecGroupLocale/$1/$2/$3');

    // -------- Tables --------
    $routes->post('products/(:num)/contents/tables', 'ProductContents::createTable/$1');                         // body: { locale, data{ title*, subtitle?, columns[], rows[], notes?, sort_order? } }
    $routes->put('products/(:num)/contents/tables/(:num)', 'ProductContents::replaceTable/$1/$2');               // body: { locale, data{ title*, subtitle?, columns[], rows[], notes?, sort_order? } }
    $routes->delete('products/(:num)/contents/tables/(:num)', 'ProductContents::deleteTable/$1/$2');
    $routes->delete('products/(:num)/contents/tables/(:num)/(:segment)', 'ProductContents::deleteTableLocale/$1/$2/$3');

    // -------- Paragraphs --------
    $routes->post('products/(:num)/contents/paragraphs', 'ProductContents::createParagraph/$1');                 // body: { locale, data{ title?, subtitle?, full_text?, sort_order? } }
    $routes->put('products/(:num)/contents/paragraphs/(:num)', 'ProductContents::replaceParagraph/$1/$2');       // body: { locale, data{ title?, subtitle?, full_text?, sort_order? } }
    $routes->delete('products/(:num)/contents/paragraphs/(:num)', 'ProductContents::deleteParagraph/$1/$2');
    $routes->delete('products/(:num)/contents/paragraphs/(:num)/(:segment)', 'ProductContents::deleteParagraphLocale/$1/$2/$3');
    $routes->delete('products/(:num)', 'Products::deleteProduct/$1'); // hard delete a product
});


$routes->group('api/admin/products', ['namespace' => 'App\Controllers\Api\Admin'], static function ($routes) {

    // ----- IMAGE ROUTES -----
    // POST /api/admin/products/{productId}/images
    $routes->post('(:num)/images', 'ProductImages::upload/$1');
    // DELETE /api/admin/products/{productId}/images/(:num)
    $routes->delete('(:num)/images/(:num)', 'ProductImages::deleteImage/$1/$2');

    // ----- IMAGE GROUP ROUTES -----
    // POST /api/admin/products/{productId}/image-groups
    $routes->post('(:num)/image-groups', 'ProductImages::createGroup/$1');
    // PUT /api/admin/products/{productId}/image-groups/(:num)
    $routes->put('(:num)/image-groups/(:num)', 'ProductImages::updateGroup/$1/$2');
    // DELETE /api/admin/products/{productId}/image-groups/(:num)
    $routes->delete('(:num)/image-groups/(:num)', 'ProductImages::deleteGroup/$1/$2');
});
