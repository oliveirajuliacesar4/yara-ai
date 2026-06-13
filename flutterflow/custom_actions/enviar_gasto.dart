import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

Future<Map<String, dynamic>> enviarGastoParaBackend(String mensagem) async {
  final user = FirebaseAuth.instance.currentUser;

  if (user == null) {
    throw Exception('Usuario nao autenticado');
  }

  final idToken = await user.getIdToken();

  final response = await http.post(
    Uri.parse('https://SUA-REGIAO-SEU-PROJETO.cloudfunctions.net/processarGasto'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $idToken',
    },
    body: jsonEncode({
      'mensagem': mensagem,
    }),
  );

  if (response.statusCode != 200) {
    throw Exception('Erro ao enviar gasto: ${response.body}');
  }

  return jsonDecode(response.body) as Map<String, dynamic>;
}
