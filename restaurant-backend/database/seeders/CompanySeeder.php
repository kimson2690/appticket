<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Company;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $companies = [
            [
                'name' => 'TechCorp Solutions',
                'type' => 'IT',
                'email' => 'contact@techcorp.sn',
                'phone' => '+221 33 123 45 67',
                'address' => '15 Avenue Bourguiba',
                'city' => 'Dakar',
                'postal_code' => '12500',
                'country' => 'Sénégal',
                'website' => 'https://techcorp.sn',
                'description' => 'Société de développement logiciel spécialisée dans les solutions d\'entreprise',
                'status' => 'active',
                'ticket_value' => 2500,
                'ticket_validity_days' => 30,
            ],
            [
                'name' => 'Banque Atlantique',
                'type' => 'Bank',
                'email' => 'rh@banqueatlantique.sn',
                'phone' => '+221 33 987 65 43',
                'address' => 'Place de l\'Indépendance',
                'city' => 'Dakar',
                'postal_code' => '12000',
                'country' => 'Sénégal',
                'website' => 'https://banqueatlantique.sn',
                'description' => 'Institution bancaire leader en Afrique de l\'Ouest',
                'status' => 'active',
                'ticket_value' => 3000,
                'ticket_validity_days' => 45,
            ],
            [
                'name' => 'Sonatel Orange',
                'type' => 'Telecom',
                'email' => 'admin@orange.sn',
                'phone' => '+221 33 456 78 90',
                'address' => '46 Boulevard de la République',
                'city' => 'Dakar',
                'postal_code' => '12100',
                'country' => 'Sénégal',
                'website' => 'https://orange.sn',
                'description' => 'Opérateur de télécommunications et services numériques',
                'status' => 'active',
                'ticket_value' => 2800,
                'ticket_validity_days' => 30,
            ],
            [
                'name' => 'Ministère de la Santé',
                'type' => 'Admin',
                'email' => 'contact@sante.gouv.sn',
                'phone' => '+221 33 321 54 87',
                'address' => 'Rue Aimé Césaire',
                'city' => 'Dakar',
                'postal_code' => '12200',
                'country' => 'Sénégal',
                'description' => 'Administration publique - Ministère de la Santé et de l\'Action Sociale',
                'status' => 'suspended',
                'ticket_value' => 2000,
                'ticket_validity_days' => 60,
            ],
            [
                'name' => 'Groupe CBAO',
                'type' => 'Bank',
                'email' => 'info@cbao.sn',
                'phone' => '+221 33 889 90 00',
                'address' => '1 Place de l\'Indépendance',
                'city' => 'Dakar',
                'postal_code' => '12000',
                'country' => 'Sénégal',
                'website' => 'https://cbao.sn',
                'description' => 'Banque commerciale et services financiers',
                'status' => 'active',
                'ticket_value' => 3200,
                'ticket_validity_days' => 45,
            ],
        ];

        foreach ($companies as $companyData) {
            Company::create($companyData);
        }

        $this->command->info('✅ 5 entreprises créées avec succès');
    }
}
