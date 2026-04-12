-- ==============================================================================
-- ALTA DE USUARIO / AGENCIA MAXDEVS EN SUITO
-- ==============================================================================
-- Por favor, ejecuta este script en el SQL Editor de tu Dashboard de Supabase.
-- Deberás reemplazar el valor '<TU_AUTH_UUID>' por el ID de tu usuario en auth.users,
-- si deseas vincularlo a un inicio de sesión. Si lo dejas en NULL o envías un UUID falso, funcionará igual para la tarjeta pública.

INSERT INTO public.businesses (
    user_id,
    nombre_negocio,
    slug,
    profession,
    description,
    telefono,
    email,
    location,
    is_premium,
    active_modules,
    website,
    instagram
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- REEMPLAZAR CON TU AUTH_ID
    'MaxDevs Solutions',
    'maxdevs',
    'Technical Excellence',
    'Elite software engineering and product design for startups and scale-ups.',
    '5491162621406',
    'hello@maxdevs.com',
    'Buenos Aires, Argentina (Remote)',
    true,
    '{"card", "appointments"}', -- Modulos activos
    'https://maxdevssolutions.com/', -- REEMPLAZAR con el dominio final del portfolio
    'maxdevs.solutions'
) ON CONFLICT (slug) DO UPDATE 
SET 
    nombre_negocio = EXCLUDED.nombre_negocio,
    website = EXCLUDED.website,
    is_premium = EXCLUDED.is_premium;
